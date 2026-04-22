-- ============================================================
-- FIX: Trigger tidak boleh auto-daftarkan user yang tidak dikenal
-- Sebelumnya: user baru yang tidak terdaftar di-insert dengan role='walimurid'
-- Sesudah:    hanya lakukan merge jika ada profil lama (pre-registered oleh admin)
--             User yang benar-benar baru dan tidak terdaftar → tidak masuk public.users
--             → callback akan redirect ke /unauthorized
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id uuid;
BEGIN
  -- Cari profil yang sudah ada dengan email ini (dibuat admin sebelumnya)
  SELECT id INTO existing_id
    FROM public.users
   WHERE email = NEW.email
   LIMIT 1;

  IF existing_id IS NOT NULL AND existing_id <> NEW.id THEN
    -- Profil lama ada (dibuat admin) dengan id berbeda → link ke auth id baru
    INSERT INTO public.users (id, email, role, first_name, last_name, phone, created_at)
    SELECT NEW.id, email, role, first_name, last_name, phone, now()
      FROM public.users
     WHERE id = existing_id;

    UPDATE public.guardians SET user_id = NEW.id WHERE user_id = existing_id;

    DELETE FROM public.users WHERE id = existing_id;
  END IF;

  -- Jika tidak ada profil lama → TIDAK insert apapun.
  -- User ini tidak dikenal dan akan diarahkan ke /unauthorized oleh callback.

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO service_role;
