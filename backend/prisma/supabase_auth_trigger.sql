-- =============================================================
-- Routiq: Supabase Auth → public.users trigger
-- Poženi ta SQL v: Supabase Dashboard → SQL Editor → New query
-- =============================================================

-- 1. Funkcija ki se pokliče ob vsakem novem registriranem userju
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, "avatarUrl", "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    -- Vzame name iz user_metadata (nastavljeno med registracijo), ali pa email prefix kot fallback
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    -- Avatar URL (Google OAuth ga pošlje kot 'avatar_url' ali 'picture')
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email       = EXCLUDED.email,
      name        = COALESCE(EXCLUDED.name, public.users.name),
      "avatarUrl" = COALESCE(EXCLUDED."avatarUrl", public.users."avatarUrl"),
      "updatedAt" = NOW();

  RETURN NEW;
END;
$$;

-- 2. Trigger ki pokliče funkcijo ob INSERT-u v auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- OPCIJSKO: Sinhroniziraj obstoječe auth userje ki so že tam
-- (poženi enkrat ročno, če imaš test userje iz prejšnjih testov)
-- =============================================================
/*
INSERT INTO public.users (id, email, name, "avatarUrl", "createdAt", "updatedAt")
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'full_name',
    split_part(email, '@', 1)
  ),
  COALESCE(
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'picture'
  ),
  created_at,
  NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE
  SET
    email       = EXCLUDED.email,
    name        = COALESCE(EXCLUDED.name, public.users.name),
    "avatarUrl" = COALESCE(EXCLUDED."avatarUrl", public.users."avatarUrl"),
    "updatedAt" = NOW();
*/
