-- Create function to get referral reward based on VIP level
CREATE OR REPLACE FUNCTION public.get_referral_reward(p_vip_level INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
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

-- Create function to get task commission rate based on VIP level
CREATE OR REPLACE FUNCTION public.get_task_commission_rate(p_vip_level INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
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

-- Create referral_rewards table to track referral bonuses
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id),
  referred_id UUID NOT NULL REFERENCES public.profiles(id),
  reward_amount NUMERIC NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'registration',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on referral_rewards
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral rewards
CREATE POLICY "Users can view their own referral rewards"
ON public.referral_rewards
FOR SELECT
USING (referrer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create trigger function for referral registration reward
CREATE OR REPLACE FUNCTION public.handle_referral_registration_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_vip_level INTEGER;
  v_reward NUMERIC;
BEGIN
  -- Only process if there's a referrer
  IF NEW.referrer_id IS NOT NULL THEN
    -- Get referrer's VIP level
    SELECT vip_level INTO v_referrer_vip_level
    FROM profiles
    WHERE id = NEW.referrer_id;
    
    -- Calculate reward based on VIP level
    v_reward := get_referral_reward(v_referrer_vip_level);
    
    -- Only give reward if VIP level > 0
    IF v_reward > 0 THEN
      -- Update referrer's balance
      UPDATE profiles
      SET balance = balance + v_reward,
          total_earned = total_earned + v_reward
      WHERE id = NEW.referrer_id;
      
      -- Log the reward
      INSERT INTO referral_rewards (referrer_id, referred_id, reward_amount, reward_type)
      VALUES (NEW.referrer_id, NEW.id, v_reward, 'registration');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral registration
DROP TRIGGER IF EXISTS on_referral_registration ON public.profiles;
CREATE TRIGGER on_referral_registration
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_referral_registration_reward();

-- Create trigger function for task completion commission
CREATE OR REPLACE FUNCTION public.handle_task_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_vip_level INTEGER;
  v_commission_rate NUMERIC;
  v_commission NUMERIC;
BEGIN
  -- Get the referrer of the user who completed the task
  SELECT referrer_id INTO v_referrer_id
  FROM profiles
  WHERE id = NEW.profile_id;
  
  -- Only process if there's a referrer
  IF v_referrer_id IS NOT NULL THEN
    -- Get referrer's VIP level
    SELECT vip_level INTO v_referrer_vip_level
    FROM profiles
    WHERE id = v_referrer_id;
    
    -- Calculate commission based on VIP level
    v_commission_rate := get_task_commission_rate(v_referrer_vip_level);
    v_commission := NEW.reward_amount * v_commission_rate;
    
    -- Only give commission if VIP level > 0
    IF v_commission > 0 THEN
      -- Update referrer's balance
      UPDATE profiles
      SET balance = balance + v_commission,
          total_earned = total_earned + v_commission
      WHERE id = v_referrer_id;
      
      -- Log the commission
      INSERT INTO referral_rewards (referrer_id, referred_id, reward_amount, reward_type)
      VALUES (v_referrer_id, NEW.profile_id, v_commission, 'task_commission');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for task commission
DROP TRIGGER IF EXISTS on_task_completion_commission ON public.task_completions;
CREATE TRIGGER on_task_completion_commission
  AFTER INSERT ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_task_commission();

-- Create vip_purchases table to track VIP purchases for promotion logic
CREATE TABLE IF NOT EXISTS public.vip_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  vip_level INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vip_purchases
ALTER TABLE public.vip_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own VIP purchases
CREATE POLICY "Users can view their own vip purchases"
ON public.vip_purchases
FOR SELECT
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can insert their own VIP purchases
CREATE POLICY "Users can insert their own vip purchases"
ON public.vip_purchases
FOR INSERT
WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create function to check and grant VIP promotion
CREATE OR REPLACE FUNCTION public.check_vip_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_vip_level INTEGER;
  v_referral_vip_count INTEGER;
BEGIN
  -- Get the referrer of the user who purchased VIP
  SELECT referrer_id INTO v_referrer_id
  FROM profiles
  WHERE id = NEW.profile_id;
  
  -- Only process if there's a referrer
  IF v_referrer_id IS NOT NULL THEN
    -- Get referrer's current VIP level
    SELECT vip_level INTO v_referrer_vip_level
    FROM profiles
    WHERE id = v_referrer_id;
    
    -- Only check if referrer's VIP is less than the purchased VIP
    IF v_referrer_vip_level < NEW.vip_level THEN
      -- Count how many referrals have purchased this VIP level or higher
      SELECT COUNT(*) INTO v_referral_vip_count
      FROM vip_purchases vp
      INNER JOIN profiles p ON p.id = vp.profile_id
      WHERE p.referrer_id = v_referrer_id
        AND vp.vip_level >= NEW.vip_level;
      
      -- If 3+ referrals have purchased this VIP level, grant it to referrer
      IF v_referral_vip_count >= 3 THEN
        UPDATE profiles
        SET vip_level = NEW.vip_level
        WHERE id = v_referrer_id
          AND vip_level < NEW.vip_level;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for VIP promotion
DROP TRIGGER IF EXISTS on_vip_purchase_promotion ON public.vip_purchases;
CREATE TRIGGER on_vip_purchase_promotion
  AFTER INSERT ON public.vip_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.check_vip_promotion();