
-- FIX 1: Restrict profile UPDATE to only safe fields (nickname, phone_number)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update safe fields only"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  -- Ensure critical fields cannot be changed by the user
  balance = (SELECT balance FROM profiles p2 WHERE p2.id = id) AND
  total_earned = (SELECT total_earned FROM profiles p2 WHERE p2.id = id) AND
  vip_level = (SELECT vip_level FROM profiles p2 WHERE p2.id = id) AND
  is_suspicious = (SELECT is_suspicious FROM profiles p2 WHERE p2.id = id) AND
  withdrawal_blocked = (SELECT withdrawal_blocked FROM profiles p2 WHERE p2.id = id) AND
  block_reason = (SELECT block_reason FROM profiles p2 WHERE p2.id = id) AND
  referral_code = (SELECT referral_code FROM profiles p2 WHERE p2.id = id) AND
  referrer_id = (SELECT referrer_id FROM profiles p2 WHERE p2.id = id) AND
  device_fingerprint = (SELECT device_fingerprint FROM profiles p2 WHERE p2.id = id) AND
  registration_ip = (SELECT registration_ip FROM profiles p2 WHERE p2.id = id)
);

-- FIX 2: Add VIP purchase trigger that deducts balance and grants VIP
CREATE OR REPLACE FUNCTION public.handle_vip_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance numeric;
  v_current_vip integer;
  v_expected_price numeric;
BEGIN
  -- Validate VIP level
  IF NEW.vip_level NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Invalid VIP level';
  END IF;

  -- Get expected price
  v_expected_price := CASE NEW.vip_level
    WHEN 1 THEN 50
    WHEN 2 THEN 99
    WHEN 3 THEN 199
    WHEN 4 THEN 499
    WHEN 5 THEN 999
  END;

  -- Verify amount matches expected price
  IF NEW.amount != v_expected_price THEN
    RAISE EXCEPTION 'Invalid purchase amount';
  END IF;

  -- Lock profile and check balance
  SELECT balance, vip_level INTO v_current_balance, v_current_vip
  FROM profiles WHERE id = NEW.profile_id FOR UPDATE;

  IF v_current_vip >= NEW.vip_level THEN
    RAISE EXCEPTION 'Already have this VIP level or higher';
  END IF;

  IF v_current_balance < v_expected_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance and grant VIP
  UPDATE profiles
  SET balance = balance - v_expected_price,
      vip_level = NEW.vip_level
  WHERE id = NEW.profile_id;

  RETURN NEW;
END;
$$;

-- Create trigger for VIP purchases
DROP TRIGGER IF EXISTS trigger_handle_vip_purchase ON public.vip_purchases;
CREATE TRIGGER trigger_handle_vip_purchase
  BEFORE INSERT ON public.vip_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_vip_purchase();

-- FIX 3: Add TRC20 address validation to check_withdrawal_allowed
CREATE OR REPLACE FUNCTION public.check_withdrawal_allowed(p_profile_id uuid, p_usdt_address text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_wallet_used_by RECORD;
  v_ip_shared_count INTEGER;
  v_same_device_count INTEGER;
BEGIN
  -- Validate TRC20 address format
  IF p_usdt_address !~ '^T[A-Za-z1-9]{33}$' THEN
    RETURN json_build_object('allowed', false, 'reason', 'invalid_address', 'message', 'არასწორი USDT TRC20 მისამართის ფორმატი');
  END IF;

  -- SECURITY: Verify caller owns this profile
  SELECT * INTO v_profile 
  FROM profiles 
  WHERE id = p_profile_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'unauthorized', 'message', 'არაავტორიზებული მოთხოვნა');
  END IF;
  
  IF v_profile.withdrawal_blocked = true THEN
    RETURN json_build_object('allowed', false, 'reason', 'blocked', 'message', 'უსაფრთხოების გაფრთხილება: მრავალი ანგარიში არ არის დაშვებული ერთი მოწყობილობიდან/ნომრიდან. თქვენი წვდომა შეზღუდულია.');
  END IF;
  
  IF v_profile.is_suspicious = true THEN
    RETURN json_build_object('allowed', false, 'reason', 'suspicious', 'message', 'თქვენი ანგარიში შეჩერებულია უსაფრთხოების შემოწმებისთვის');
  END IF;
  
  SELECT p.id, p.nickname INTO v_wallet_used_by 
  FROM withdrawals w
  JOIN profiles p ON p.id = w.profile_id
  WHERE w.usdt_address = p_usdt_address 
  AND w.profile_id != p_profile_id
  LIMIT 1;
  
  IF FOUND THEN
    UPDATE profiles SET is_suspicious = true, withdrawal_blocked = true, 
      block_reason = 'Duplicate wallet address detected'
    WHERE id = p_profile_id OR id = v_wallet_used_by.id;
    
    INSERT INTO suspicious_wallets (usdt_address, first_seen_profile_id)
    VALUES (p_usdt_address, v_wallet_used_by.id)
    ON CONFLICT DO NOTHING;
    
    RETURN json_build_object('allowed', false, 'reason', 'duplicate_wallet', 'message', 'უსაფრთხოების გაფრთხილება: მრავალი ანგარიში არ არის დაშვებული ერთი მოწყობილობიდან/ნომრიდან. თქვენი წვდომა შეზღუდულია.');
  END IF;
  
  SELECT COUNT(DISTINCT pi.profile_id) INTO v_ip_shared_count
  FROM profile_ips pi
  WHERE pi.ip_address IN (
    SELECT ip_address FROM profile_ips WHERE profile_id = p_profile_id
  );
  
  IF v_ip_shared_count > 1 THEN
    UPDATE profiles SET is_suspicious = true
    WHERE id = p_profile_id;
    
    RETURN json_build_object('allowed', false, 'reason', 'shared_ip', 'message', 'უსაფრთხოების გაფრთხილება: მრავალი ანგარიში არ არის დაშვებული ერთი მოწყობილობიდან/ნომრიდან. თქვენი წვდომა შეზღუდულია.');
  END IF;
  
  IF v_profile.device_fingerprint IS NOT NULL THEN
    SELECT COUNT(*) INTO v_same_device_count
    FROM profiles
    WHERE device_fingerprint = v_profile.device_fingerprint;
    
    IF v_same_device_count > 1 THEN
      UPDATE profiles SET is_suspicious = true, withdrawal_blocked = true,
        block_reason = 'Multiple accounts from same device'
      WHERE device_fingerprint = v_profile.device_fingerprint;
      
      RETURN json_build_object('allowed', false, 'reason', 'duplicate_device', 'message', 'უსაფრთხოების გაფრთხილება: მრავალი ანგარიში არ არის დაშვებული ერთი მოწყობილობიდან/ნომრიდან. თქვენი წვდომა შეზღუდულია.');
    END IF;
  END IF;
  
  RETURN json_build_object('allowed', true);
END;
$$;
