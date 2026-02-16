
-- 1. Server-side TRC20 address validation trigger on withdrawals
CREATE OR REPLACE FUNCTION public.validate_withdrawal_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.usdt_address !~ '^T[A-Za-z1-9]{33}$' THEN
    RAISE EXCEPTION 'Invalid USDT TRC20 address format';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_withdrawal_address_trigger
  BEFORE INSERT ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_withdrawal_address();

-- 2. Server-side claim_free_vip RPC function
CREATE OR REPLACE FUNCTION public.claim_free_vip(
  p_profile_id uuid,
  p_vip_level integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_vip integer;
  v_referral_count integer;
  v_free_vip_requirement integer := 3;
BEGIN
  -- Verify caller owns this profile
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_profile_id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Get current VIP level with lock
  SELECT vip_level INTO v_current_vip
  FROM profiles WHERE id = p_profile_id FOR UPDATE;

  IF v_current_vip >= p_vip_level THEN
    RETURN json_build_object('success', false, 'message', 'Already have this VIP level or higher');
  END IF;

  -- Validate VIP level range
  IF p_vip_level NOT BETWEEN 1 AND 5 THEN
    RETURN json_build_object('success', false, 'message', 'Invalid VIP level');
  END IF;

  -- Count referrals that have purchased this VIP level or higher
  SELECT COUNT(*) INTO v_referral_count
  FROM vip_purchases vp
  INNER JOIN profiles p ON p.id = vp.profile_id
  WHERE p.referrer_id = p_profile_id
    AND vp.vip_level >= p_vip_level;

  IF v_referral_count < v_free_vip_requirement THEN
    RETURN json_build_object('success', false, 'message', 'Not enough referrals with this VIP level');
  END IF;

  -- Grant the VIP level
  UPDATE profiles
  SET vip_level = p_vip_level
  WHERE id = p_profile_id;

  -- Record as free purchase
  INSERT INTO vip_purchases (profile_id, vip_level, amount)
  VALUES (p_profile_id, p_vip_level, 0);

  RETURN json_build_object('success', true);
END;
$$;

-- 3. Fix task completion race condition - use advisory lock in trigger
CREATE OR REPLACE FUNCTION public.handle_task_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_vip_level integer;
  v_actual_reward numeric;
BEGIN
  -- Acquire advisory lock based on profile_id to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(NEW.profile_id::text || NEW.task_id));

  -- Check if already completed (within advisory lock)
  IF EXISTS (
    SELECT 1 FROM task_completions 
    WHERE profile_id = NEW.profile_id AND task_id = NEW.task_id
  ) THEN
    RAISE EXCEPTION 'Task already completed';
  END IF;

  -- Get user's VIP level
  SELECT vip_level INTO v_vip_level
  FROM profiles
  WHERE id = NEW.profile_id;
  
  -- Calculate correct reward based on VIP level
  v_actual_reward := CASE v_vip_level
    WHEN 0 THEN 0.10
    WHEN 1 THEN 1.00
    WHEN 2 THEN 2.30
    WHEN 3 THEN 3.40
    WHEN 4 THEN 5.00
    WHEN 5 THEN 7.50
    ELSE 0.10
  END;
  
  -- Override client-supplied reward_amount
  NEW.reward_amount := v_actual_reward;
  
  -- Update balance
  UPDATE profiles
  SET balance = balance + v_actual_reward,
      total_earned = total_earned + v_actual_reward
  WHERE id = NEW.profile_id;
  
  RETURN NEW;
END;
$$;
