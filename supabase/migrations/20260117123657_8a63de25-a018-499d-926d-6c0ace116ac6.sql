-- =========================================
-- SECURITY FIX 1: Add authentication checks to RPC functions
-- =========================================

-- Fix check_withdrawal_allowed to require authentication
CREATE OR REPLACE FUNCTION public.check_withdrawal_allowed(p_profile_id uuid, p_usdt_address text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_wallet_used_by RECORD;
  v_ip_shared_count INTEGER;
  v_same_device_count INTEGER;
BEGIN
  -- SECURITY: Verify caller owns this profile
  SELECT * INTO v_profile 
  FROM profiles 
  WHERE id = p_profile_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'unauthorized', 'message', 'არაავტორიზებული მოთხოვნა');
  END IF;
  
  -- Check if profile is blocked from withdrawals
  IF v_profile.withdrawal_blocked = true THEN
    RETURN json_build_object('allowed', false, 'reason', 'blocked', 'message', 'უსაფრთხოების გაფრთხილება: მრავალი ანგარიში არ არის დაშვებული ერთი მოწყობილობიდან/ნომრიდან. თქვენი წვდომა შეზღუდულია.');
  END IF;
  
  -- Check if profile is flagged as suspicious
  IF v_profile.is_suspicious = true THEN
    RETURN json_build_object('allowed', false, 'reason', 'suspicious', 'message', 'თქვენი ანგარიში შეჩერებულია უსაფრთხოების შემოწმებისთვის');
  END IF;
  
  -- Check if wallet address is used by another profile
  SELECT p.id, p.nickname INTO v_wallet_used_by 
  FROM withdrawals w
  JOIN profiles p ON p.id = w.profile_id
  WHERE w.usdt_address = p_usdt_address 
  AND w.profile_id != p_profile_id
  LIMIT 1;
  
  IF FOUND THEN
    -- Flag both profiles as suspicious
    UPDATE profiles SET is_suspicious = true, withdrawal_blocked = true, 
      block_reason = 'Duplicate wallet address detected'
    WHERE id = p_profile_id OR id = v_wallet_used_by.id;
    
    -- Log the suspicious wallet
    INSERT INTO suspicious_wallets (usdt_address, first_seen_profile_id)
    VALUES (p_usdt_address, v_wallet_used_by.id)
    ON CONFLICT DO NOTHING;
    
    RETURN json_build_object('allowed', false, 'reason', 'duplicate_wallet', 'message', 'უსაფრთხოების გაფრთხილება: მრავალი ანგარიში არ არის დაშვებული ერთი მოწყობილობიდან/ნომრიდან. თქვენი წვდომა შეზღუდულია.');
  END IF;
  
  -- Check if multiple profiles share same IP
  SELECT COUNT(DISTINCT pi.profile_id) INTO v_ip_shared_count
  FROM profile_ips pi
  WHERE pi.ip_address IN (
    SELECT ip_address FROM profile_ips WHERE profile_id = p_profile_id
  );
  
  IF v_ip_shared_count > 1 THEN
    -- Flag this profile
    UPDATE profiles SET is_suspicious = true
    WHERE id = p_profile_id;
    
    RETURN json_build_object('allowed', false, 'reason', 'shared_ip', 'message', 'უსაფრთხოების გაფრთხილება: მრავალი ანგარიში არ არის დაშვებული ერთი მოწყობილობიდან/ნომრიდან. თქვენი წვდომა შეზღუდულია.');
  END IF;
  
  -- Check if same device fingerprint is used by multiple accounts
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

-- Fix log_profile_ip to require authentication
CREATE OR REPLACE FUNCTION public.log_profile_ip(p_profile_id uuid, p_ip_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- SECURITY: Verify caller owns this profile
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_profile_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  INSERT INTO profile_ips (profile_id, ip_address)
  VALUES (p_profile_id, p_ip_address)
  ON CONFLICT (profile_id, ip_address) 
  DO UPDATE SET last_seen_at = now();
END;
$$;

-- =========================================
-- SECURITY FIX 2: Fix search_path for all functions that don't have it
-- =========================================

-- Fix get_referral_reward - add search_path
CREATE OR REPLACE FUNCTION public.get_referral_reward(p_vip_level integer)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
  CASE p_vip_level
    WHEN 1 THEN RETURN 0.25;
    WHEN 2 THEN RETURN 0.50;
    WHEN 3 THEN RETURN 0.75;
    WHEN 4 THEN RETURN 1.00;
    WHEN 5 THEN RETURN 2.50;
    ELSE RETURN 0.00;
  END CASE;
END;
$$;

-- Fix get_task_commission_rate - add search_path
CREATE OR REPLACE FUNCTION public.get_task_commission_rate(p_vip_level integer)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
  CASE p_vip_level
    WHEN 1 THEN RETURN 0.05;
    WHEN 2 THEN RETURN 0.10;
    WHEN 3 THEN RETURN 0.15;
    WHEN 4 THEN RETURN 0.20;
    WHEN 5 THEN RETURN 0.25;
    ELSE RETURN 0.00;
  END CASE;
END;
$$;