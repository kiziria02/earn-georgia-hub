
-- Fix VIP purchase prices to match actual tier costs
CREATE OR REPLACE FUNCTION public.handle_vip_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance numeric;
  v_current_vip integer;
  v_expected_price numeric;
BEGIN
  -- Validate VIP level
  IF NEW.vip_level NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Invalid VIP level';
  END IF;

  -- Get expected price (matching actual VIP tier costs)
  v_expected_price := CASE NEW.vip_level
    WHEN 1 THEN 50
    WHEN 2 THEN 99
    WHEN 3 THEN 155
    WHEN 4 THEN 230
    WHEN 5 THEN 320
  END;

  -- Verify amount matches expected price
  IF NEW.amount != v_expected_price THEN
    RAISE EXCEPTION 'Invalid purchase amount';
  END IF;

  -- Lock profile and check balance
  SELECT balance, vip_level INTO v_current_balance, v_current_vip
  FROM profiles WHERE id = NEW.profile_id FOR UPDATE;

  IF v_current_vip >= NEW.vip_level THEN
    RAISE EXCEPTION 'Already have this VIP level or higher';
  END IF;

  IF v_current_balance < v_expected_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance and grant VIP
  UPDATE profiles
  SET balance = balance - v_expected_price,
      vip_level = NEW.vip_level
  WHERE id = NEW.profile_id;

  RETURN NEW;
END;
$$;
