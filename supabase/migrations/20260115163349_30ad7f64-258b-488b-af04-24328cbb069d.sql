-- Add anti-fraud columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS registration_ip TEXT,
ADD COLUMN IF NOT EXISTS telegram_id TEXT,
ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT FALSE;

-- Create unique constraint on device_fingerprint (allow null but prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_device_fingerprint 
ON public.profiles(device_fingerprint) 
WHERE device_fingerprint IS NOT NULL;

-- Create unique constraint on telegram_id (allow null but prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_telegram_id 
ON public.profiles(telegram_id) 
WHERE telegram_id IS NOT NULL;

-- Create table to track registration attempts for IP rate limiting
CREATE TABLE IF NOT EXISTS public.registration_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  device_fingerprint TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  was_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT
);

-- Create index for efficient IP lookup
CREATE INDEX IF NOT EXISTS idx_registration_attempts_ip 
ON public.registration_attempts(ip_address, attempted_at);

-- Create index for device fingerprint lookup
CREATE INDEX IF NOT EXISTS idx_registration_attempts_fingerprint 
ON public.registration_attempts(device_fingerprint, attempted_at);

-- Enable RLS on registration_attempts
ALTER TABLE public.registration_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow inserts via service role (edge function)
CREATE POLICY "Service role can manage registration attempts"
ON public.registration_attempts
FOR ALL
USING (false)
WITH CHECK (false);

-- Create blocked_devices table to permanently block suspicious devices
CREATE TABLE IF NOT EXISTS public.blocked_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_fingerprint TEXT UNIQUE,
  ip_address TEXT,
  telegram_id TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS on blocked_devices
ALTER TABLE public.blocked_devices ENABLE ROW LEVEL SECURITY;

-- Only allow access via service role
CREATE POLICY "Service role can manage blocked devices"
ON public.blocked_devices
FOR ALL
USING (false)
WITH CHECK (false);

-- Create function to check if registration is allowed
CREATE OR REPLACE FUNCTION public.check_registration_allowed(
  p_device_fingerprint TEXT,
  p_ip_address TEXT,
  p_telegram_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_blocked RECORD;
  v_existing_device RECORD;
  v_existing_telegram RECORD;
  v_recent_ip_count INTEGER;
BEGIN
  -- Check if device fingerprint is blocked
  SELECT * INTO v_blocked FROM blocked_devices 
  WHERE (device_fingerprint = p_device_fingerprint OR ip_address = p_ip_address OR telegram_id = p_telegram_id)
  AND is_active = true
  LIMIT 1;
  
  IF FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'device_blocked', 'message', 'ეს მოწყობილობა დაბლოკილია');
  END IF;
  
  -- Check if device fingerprint already exists
  SELECT * INTO v_existing_device FROM profiles 
  WHERE device_fingerprint = p_device_fingerprint 
  LIMIT 1;
  
  IF FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'device_exists', 'message', 'ამ მოწყობილობიდან უკვე არსებობს ანგარიში');
  END IF;
  
  -- Check if telegram_id already exists (if provided)
  IF p_telegram_id IS NOT NULL THEN
    SELECT * INTO v_existing_telegram FROM profiles 
    WHERE telegram_id = p_telegram_id 
    LIMIT 1;
    
    IF FOUND THEN
      RETURN json_build_object('allowed', false, 'reason', 'telegram_exists', 'message', 'ეს Telegram ანგარიში უკვე დაკავშირებულია');
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
$$;

-- Create function to log registration attempt
CREATE OR REPLACE FUNCTION public.log_registration_attempt(
  p_ip_address TEXT,
  p_device_fingerprint TEXT,
  p_was_blocked BOOLEAN DEFAULT FALSE,
  p_block_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO registration_attempts (ip_address, device_fingerprint, was_blocked, block_reason)
  VALUES (p_ip_address, p_device_fingerprint, p_was_blocked, p_block_reason);
END;
$$;