-- ============================================================
-- FIX: Trigger handle_new_auth_user
-- Masalah: Trigger selalu INSERT role='admin', tidak memeriksa
--          apakah ada profil dengan email yang sama (wali murid
--          yang sudah dibuat admin sebelumnya).
-- Solusi:  Cek email dulu. Jika ada profil lama → salin ke id baru,
--          update FK guardians, hapus yang lama.
--          Jika benar-benar baru → insert dengan role='walimurid'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id   uuid;
  existing_role text;
BEGIN
  -- Cari profil yang sudah ada dengan email ini
  SELECT id, role
    INTO existing_id, existing_role
    FROM public.users
   WHERE email = NEW.email
   LIMIT 1;

  IF existing_id IS NOT NULL AND existing_id <> NEW.id THEN
    -- Profil lama ada (dibuat admin) dengan id berbeda → link ke auth id baru
    -- Langkah 1: buat entry baru dengan auth id tapi data dari profil lama
    INSERT INTO public.users (id, email, role, first_name, last_name, phone, created_at)
    SELECT NEW.id, email, role, first_name, last_name, phone, now()
      FROM public.users
     WHERE id = existing_id;

    -- Langkah 2: pindahkan guardians ke id baru
    UPDATE public.guardians SET user_id = NEW.id WHERE user_id = existing_id;

    -- Langkah 3: hapus profil lama
    DELETE FROM public.users WHERE id = existing_id;

  ELSIF existing_id IS NULL THEN
    -- Benar-benar pengguna baru → buat dengan role default walimurid
    -- (Admin bisa ubah role nanti via dashboard)
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'walimurid')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  -- Jika existing_id = NEW.id → profil sudah ada dan benar, tidak perlu apa-apa

  RETURN NEW;
END;
$$;

-- Pastikan trigger terpasang
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO service_role;
