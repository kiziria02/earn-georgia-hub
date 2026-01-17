-- Add phone_number to profiles for contact verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS withdrawal_blocked boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS block_reason text;

-- Create unique index on phone_number (allowing null for existing users)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles (phone_number) WHERE phone_number IS NOT NULL;

-- Create table to track suspicious wallet addresses
CREATE TABLE IF NOT EXISTS public.suspicious_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usdt_address text NOT NULL,
  first_seen_profile_id uuid NOT NULL,
  flagged_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS on suspicious_wallets
ALTER TABLE public.suspicious_wallets ENABLE ROW LEVEL SECURITY;

-- Only service role can manage suspicious wallets
CREATE POLICY "Service role can manage suspicious wallets" 
ON public.suspicious_wallets 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create table to track IP addresses used by profiles
CREATE TABLE IF NOT EXISTS public.profile_ips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  ip_address text NOT NULL,
  first_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on profile_ips
ALTER TABLE public.profile_ips ENABLE ROW LEVEL SECURITY;

-- Only service role can manage profile IPs
CREATE POLICY "Service role can manage profile IPs" 
ON public.profile_ips 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create unique index to prevent duplicate profile+ip entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_ips_unique ON public.profile_ips (profile_id, ip_address);

-- Enhanced registration check function with phone number validation
CREATE OR REPLACE FUNCTION public.check_registration_allowed_v2(
  p_device_fingerprint text, 
  p_ip_address text, 
  p_telegram_id text DEFAULT NULL,
  p_phone_number text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSON;
  v_blocked RECORD;
  v_existing_device RECORD;
  v_existing_telegram RECORD;
  v_existing_phone RECORD;
  v_recent_ip_count INTEGER;
BEGIN
  -- Check if device fingerprint is blocked
  SELECT * INTO v_blocked FROM blocked_devices 
  WHERE (device_fingerprint = p_device_fingerprint OR ip_address = p_ip_address OR telegram_id = p_telegram_id)
  AND is_active = true
  LIMIT 1;
  
  IF FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'device_blocked', 'message', 'უსაფრთხოების გაფრთხილება: მრავალი ანგარიში არ არის დაშვებული ერთი მოწყობილობიდან/ნომრიდან. თქვენი წვდომა შეზღუდულია.');
  END IF;
  
  -- Check if device fingerprint already exists
  SELECT * INTO v_existing_device FROM profiles 
  WHERE device_fingerprint = p_device_fingerprint 
  LIMIT 1;
  
  IF FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'device_exists', 'message', 'უსაფრთხოების გაფრთხილება: მრავალი ანგარიში არ არის დაშვებული ერთი მოწყობილობიდან/ნომრიდან. თქვენი წვდომა შეზღუდულია.');
  END IF;
  
  -- Check if telegram_id already exists (if provided)
  IF p_telegram_id IS NOT NULL THEN
    SELECT * INTO v_existing_telegram FROM profiles 
    WHERE telegram_id = p_telegram_id 
    LIMIT 1;
    
    IF FOUND THEN
      RETURN json_build_object('allowed', false, 'reason', 'telegram_exists', 'message', 'ეს Telegram ანგარიში უკვე დაკავშირებულია სხვა ანგარიშთან');
    END IF;
  END IF;
  
  -- Check if phone_number already exists (if provided)
  IF p_phone_number IS NOT NULL THEN
    SELECT * INTO v_existing_phone FROM profiles 
    WHERE phone_number = p_phone_number 
    LIMIT 1;
    
    IF FOUND THEN
      RETURN json_build_object('allowed', false, 'reason', 'phone_exists', 'message', 'ეს ტელეფონის ნომერი უკვე დაკავშირებულია სხვა ანგარიშთან');
    END IF;
  END IF;
  
  -- Check IP rate limiting (max 3 registrations per IP in 24 hours)
  SELECT COUNT(*) INTO v_recent_ip_count FROM registration_attempts 
  WHERE ip_address = p_ip_address 
  AND attempted_at > now() - interval '24 hours'
  AND was_blocked = false;
  
  IF v_recent_ip_count >= 3 THEN
    RETURN json_build_object('allowed', false, 'reason', 'ip_rate_limit', 'message', 'ამ IP მისამართიდან ძალიან ბევრი რეგისტრაციის მცდელობა');
  END IF;
  
  RETURN json_build_object('allowed', true);
END;
$function$;

-- Function to check withdrawal eligibility
CREATE OR REPLACE FUNCTION public.check_withdrawal_allowed(p_profile_id uuid, p_usdt_address text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile RECORD;
  v_wallet_used_by RECORD;
  v_ip_shared_count INTEGER;
  v_same_device_count INTEGER;
BEGIN
  -- Get profile info
  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'profile_not_found', 'message', 'პროფილი ვერ მოიძებნა');
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
$function$;

-- Function to log IP address for a profile
CREATE OR REPLACE FUNCTION public.log_profile_ip(p_profile_id uuid, p_ip_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO profile_ips (profile_id, ip_address)
  VALUES (p_profile_id, p_ip_address)
  ON CONFLICT (profile_id, ip_address) 
  DO UPDATE SET last_seen_at = now();
END;
$function$;