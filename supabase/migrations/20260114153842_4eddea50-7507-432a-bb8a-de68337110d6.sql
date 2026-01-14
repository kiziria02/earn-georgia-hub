-- Fix function search path for handle_referral_bonus
CREATE OR REPLACE FUNCTION public.handle_referral_bonus()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referrer_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET balance = balance + 0.25,
        total_earned = total_earned + 0.25
    WHERE id = NEW.referrer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;