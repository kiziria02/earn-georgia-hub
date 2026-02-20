-- Fix the profiles update policy: p2.id = p2.id is always true, should be p2.id = profiles.id
DROP POLICY IF EXISTS "Users can update safe fields only" ON public.profiles;

CREATE POLICY "Users can update safe fields only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  (balance = (SELECT p2.balance FROM profiles p2 WHERE p2.id = profiles.id))
  AND (total_earned = (SELECT p2.total_earned FROM profiles p2 WHERE p2.id = profiles.id))
  AND (vip_level = (SELECT p2.vip_level FROM profiles p2 WHERE p2.id = profiles.id))
  AND (is_suspicious = (SELECT p2.is_suspicious FROM profiles p2 WHERE p2.id = profiles.id))
  AND (withdrawal_blocked = (SELECT p2.withdrawal_blocked FROM profiles p2 WHERE p2.id = profiles.id))
  AND (block_reason = (SELECT p2.block_reason FROM profiles p2 WHERE p2.id = profiles.id))
  AND (referral_code = (SELECT p2.referral_code FROM profiles p2 WHERE p2.id = profiles.id))
  AND (referrer_id = (SELECT p2.referrer_id FROM profiles p2 WHERE p2.id = profiles.id))
  AND (device_fingerprint = (SELECT p2.device_fingerprint FROM profiles p2 WHERE p2.id = profiles.id))
  AND (registration_ip = (SELECT p2.registration_ip FROM profiles p2 WHERE p2.id = profiles.id))
);