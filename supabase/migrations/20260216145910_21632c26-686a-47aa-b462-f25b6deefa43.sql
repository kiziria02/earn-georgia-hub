
-- Add deny UPDATE/DELETE policies to financial tables to prevent tampering

-- deposits: deny UPDATE and DELETE
CREATE POLICY "Deny updates to deposits" ON public.deposits
FOR UPDATE USING (false);

CREATE POLICY "Deny deletes from deposits" ON public.deposits
FOR DELETE USING (false);

-- milestone_claims: deny INSERT, UPDATE, DELETE (only created by SECURITY DEFINER functions)
CREATE POLICY "Deny inserts to milestone_claims" ON public.milestone_claims
FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny updates to milestone_claims" ON public.milestone_claims
FOR UPDATE USING (false);

CREATE POLICY "Deny deletes from milestone_claims" ON public.milestone_claims
FOR DELETE USING (false);

-- referral_rewards: deny INSERT, UPDATE, DELETE (only created by triggers)
CREATE POLICY "Deny inserts to referral_rewards" ON public.referral_rewards
FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny updates to referral_rewards" ON public.referral_rewards
FOR UPDATE USING (false);

CREATE POLICY "Deny deletes from referral_rewards" ON public.referral_rewards
FOR DELETE USING (false);

-- vip_purchases: deny UPDATE and DELETE
CREATE POLICY "Deny updates to vip_purchases" ON public.vip_purchases
FOR UPDATE USING (false);

CREATE POLICY "Deny deletes from vip_purchases" ON public.vip_purchases
FOR DELETE USING (false);

-- task_completions: deny UPDATE and DELETE
CREATE POLICY "Deny updates to task_completions" ON public.task_completions
FOR UPDATE USING (false);

CREATE POLICY "Deny deletes from task_completions" ON public.task_completions
FOR DELETE USING (false);

-- profiles: deny DELETE
CREATE POLICY "Deny deletes from profiles" ON public.profiles
FOR DELETE USING (false);
