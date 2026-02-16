
-- Ensure internal tables have explicit deny-all policies for direct access
-- These tables are only accessed via SECURITY DEFINER functions

-- suspicious_wallets: deny all direct access
CREATE POLICY "Deny all direct access to suspicious_wallets"
ON public.suspicious_wallets FOR ALL
USING (false)
WITH CHECK (false);

-- profile_ips: deny all direct access (accessed via log_profile_ip RPC)
CREATE POLICY "Deny all direct access to profile_ips"
ON public.profile_ips FOR ALL
USING (false)
WITH CHECK (false);

-- registration_attempts: deny all direct access (accessed via log_registration_attempt RPC)
CREATE POLICY "Deny all direct access to registration_attempts"
ON public.registration_attempts FOR ALL
USING (false)
WITH CHECK (false);

-- blocked_devices: deny all direct access
CREATE POLICY "Deny all direct access to blocked_devices"
ON public.blocked_devices FOR ALL
USING (false)
WITH CHECK (false);
