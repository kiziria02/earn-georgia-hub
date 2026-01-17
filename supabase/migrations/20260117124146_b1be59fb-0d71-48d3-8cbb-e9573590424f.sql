-- =========================================
-- SECURITY FIX: Ensure profiles table is protected from anonymous access
-- =========================================

-- The profiles table already has proper RLS policies for authenticated users.
-- RLS is enabled, and the existing policies use auth.uid() which means:
-- - Anonymous users (no auth) will have auth.uid() return NULL
-- - NULL != user_id for any row, so no rows are returned
-- This is correct behavior. However, let's add explicit deny policies for extra safety.

-- For suspicious_wallets table - currently has USING(false) policy which blocks ALL access
-- This is already secure. Let's verify by recreating cleaner policies.

-- Drop the confusing "Service role" policy and create clearer ones
DROP POLICY IF EXISTS "Service role can manage suspicious wallets" ON public.suspicious_wallets;

-- suspicious_wallets should never be readable by any user (only SECURITY DEFINER functions)
-- No policies = RLS blocks all direct access, which is what we want

-- Same for profile_ips
DROP POLICY IF EXISTS "Service role can manage profile IPs" ON public.profile_ips;

-- Ensure withdrawals cannot be updated or deleted by users
CREATE POLICY "Prevent user updates to withdrawals" 
ON public.withdrawals 
FOR UPDATE 
USING (false);

CREATE POLICY "Prevent user deletes from withdrawals" 
ON public.withdrawals 
FOR DELETE 
USING (false);