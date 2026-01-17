-- =========================================
-- SECURITY FIX 1: Remove public SELECT policy on profiles
-- =========================================

DROP POLICY IF EXISTS "Anyone can read profiles for referral lookup" ON public.profiles;

-- Create secure function to look up referrer by code
CREATE OR REPLACE FUNCTION get_referrer_by_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT id FROM profiles WHERE referral_code = p_code LIMIT 1);
END;
$$;

-- =========================================
-- SECURITY FIX 2: Fix RLS for blocked_devices and registration_attempts
-- =========================================

-- Drop the overly restrictive policies that block SECURITY DEFINER functions
DROP POLICY IF EXISTS "Service role can manage blocked devices" ON public.blocked_devices;
DROP POLICY IF EXISTS "Service role can manage registration attempts" ON public.registration_attempts;

-- These tables are only accessed by SECURITY DEFINER functions, no direct user access needed
-- RLS is enabled but no policies = blocked for normal users, but SECURITY DEFINER bypasses RLS

-- =========================================
-- SECURITY FIX 3 & 4: Server-side balance updates and reward validation
-- =========================================

-- Create trigger function for task completion that validates reward server-side
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vip_level integer;
  v_actual_reward numeric;
  v_task_exists boolean;
BEGIN
  -- Check if this task was already completed by this profile
  SELECT EXISTS(
    SELECT 1 FROM task_completions 
    WHERE profile_id = NEW.profile_id AND task_id = NEW.task_id
  ) INTO v_task_exists;
  
  -- Get user's VIP level
  SELECT vip_level INTO v_vip_level
  FROM profiles
  WHERE id = NEW.profile_id;
  
  -- Calculate correct reward based on VIP level (from constants)
  v_actual_reward := CASE v_vip_level
    WHEN 0 THEN 0.10
    WHEN 1 THEN 1.00
    WHEN 2 THEN 2.30
    WHEN 3 THEN 3.40
    WHEN 4 THEN 5.00
    WHEN 5 THEN 7.50
    ELSE 0.10
  END;
  
  -- Override client-supplied reward_amount with calculated value
  NEW.reward_amount := v_actual_reward;
  
  -- Update balance with server-calculated reward
  UPDATE profiles
  SET balance = balance + v_actual_reward,
      total_earned = total_earned + v_actual_reward
  WHERE id = NEW.profile_id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_task_completed ON task_completions;
CREATE TRIGGER on_task_completed
BEFORE INSERT ON task_completions
FOR EACH ROW
EXECUTE FUNCTION handle_task_completion();

-- Create trigger function for withdrawal balance deduction
CREATE OR REPLACE FUNCTION handle_withdrawal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
BEGIN
  -- Lock the profile row and get current balance
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = NEW.profile_id
  FOR UPDATE;
  
  -- Verify sufficient balance
  IF v_current_balance < NEW.amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Deduct from balance
  UPDATE profiles
  SET balance = balance - NEW.amount
  WHERE id = NEW.profile_id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_withdrawal_created ON withdrawals;
CREATE TRIGGER on_withdrawal_created
BEFORE INSERT ON withdrawals
FOR EACH ROW
EXECUTE FUNCTION handle_withdrawal();

-- =========================================
-- SECURITY FIX 5: Milestone bonuses implementation
-- =========================================

-- Table to track milestone claims
CREATE TABLE IF NOT EXISTS public.milestone_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id),
  milestone_count integer NOT NULL,
  bonus_amount numeric(10,2) NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, milestone_count)
);

ALTER TABLE public.milestone_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their milestone claims" ON public.milestone_claims
FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Function to check and award milestone bonuses
CREATE OR REPLACE FUNCTION check_milestone_bonuses(p_referrer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_count integer;
  v_milestones integer[] := ARRAY[50, 100, 300];
  v_bonuses numeric[] := ARRAY[20, 35, 50];
  v_milestone integer;
  v_bonus numeric;
  v_already_claimed boolean;
BEGIN
  -- Count referrals
  SELECT COUNT(*) INTO v_referral_count
  FROM profiles
  WHERE referrer_id = p_referrer_id;
  
  -- Check each milestone
  FOR i IN 1..array_length(v_milestones, 1) LOOP
    v_milestone := v_milestones[i];
    v_bonus := v_bonuses[i];
    
    -- If reached this milestone and not claimed yet
    IF v_referral_count >= v_milestone THEN
      SELECT EXISTS(
        SELECT 1 FROM milestone_claims
        WHERE profile_id = p_referrer_id AND milestone_count = v_milestone
      ) INTO v_already_claimed;
      
      IF NOT v_already_claimed THEN
        -- Award the bonus
        UPDATE profiles
        SET balance = balance + v_bonus,
            total_earned = total_earned + v_bonus
        WHERE id = p_referrer_id;
        
        -- Record the claim
        INSERT INTO milestone_claims (profile_id, milestone_count, bonus_amount)
        VALUES (p_referrer_id, v_milestone, v_bonus);
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Update referral bonus trigger to also check milestones
CREATE OR REPLACE FUNCTION public.handle_referral_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referrer_id IS NOT NULL THEN
    -- Award immediate referral bonus ($0.25)
    UPDATE profiles 
    SET balance = balance + 0.25,
        total_earned = total_earned + 0.25
    WHERE id = NEW.referrer_id;
    
    -- Check and award milestone bonuses
    PERFORM check_milestone_bonuses(NEW.referrer_id);
  END IF;
  RETURN NEW;
END;
$$;