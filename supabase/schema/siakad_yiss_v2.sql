-- ============================================================
--  SIAKAD YISS — Schema v2 (True Single-Tenant)
--
--  Perubahan dari v1:
--  - Hapus school_id dari semua tabel operasional
--  - Hapus tabel payment_settings → pindah ke .env
--  - Hapus fungsi get_my_school_id / get_school_id / auto_set_school_id
--  - users = tabel profil mandiri (tidak lagi bergantung FK ke auth.users)
--  - guardians = hapus kolom fullname; nama diambil dari users.first_name + last_name
--  - Trigger: auto-buat profil users saat auth user baru login
--  - RLS: authenticated = akses penuh
--
--  HOW TO USE:
--    1. Di Supabase: buka SQL Editor
--    2. Paste seluruh file ini → Run
-- ============================================================


-- ============================================================
-- TABEL: schools
-- Satu baris = profil YISS (nama, logo, kontak).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.schools (
  id         uuid        DEFAULT gen_random_uuid() NOT NULL,
  name       text        NOT NULL,
  address    text,
  phone      text,
  email      text,
  logo_url   text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.schools OWNER TO postgres;

INSERT INTO public.schools (name)
VALUES ('Yayasan Islam Syahida')
ON CONFLICT DO NOTHING;


-- ============================================================
-- TABEL: users
-- Tabel profil mandiri untuk SEMUA orang dalam sistem:
--   - Staff/admin: id = auth.uid() (di-set saat pertama login)
--   - Wali murid : id = gen_random_uuid() (tidak perlu akun login)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id         uuid        DEFAULT gen_random_uuid() NOT NULL,
  first_name text,
  last_name  text,
  email      text,
  phone      text,
  role       text        NOT NULL DEFAULT 'walimurid',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT users_role_check
    CHECK (role = ANY (ARRAY['admin'::text, 'walimurid'::text, 'guru'::text, 'tendik'::text]))
);

ALTER TABLE public.users OWNER TO postgres;


-- ============================================================
-- TRIGGER: auto-buat profil public.users saat auth user baru
-- Berlaku untuk login Google OAuth / email-password pertama kali.
-- ============================================================

-- Fungsi untuk mendapatkan role user yang sedang login
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'walimurid'
  )
$$;

-- Trigger: auto-buat profil public.users saat auth user baru login
-- Role default = 'admin' karena hanya staf yang punya akun login
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'admin')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ============================================================
-- TABEL: guardians (wali murid)
-- Nama wali diambil dari users.first_name + users.last_name
-- via relasi user_id → users.id
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guardians (
  id           uuid        DEFAULT gen_random_uuid() NOT NULL,
  user_id      uuid        NOT NULL,
  phone        text,
  email        text,
  relationship text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT guardians_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT guardians_relationship_check
    CHECK (relationship = ANY (ARRAY['Ayah'::text, 'Ibu'::text, 'Wali'::text]))
);

ALTER TABLE public.guardians OWNER TO postgres;


-- ============================================================
-- TABEL: students (murid)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.students (
  id          uuid        DEFAULT gen_random_uuid() NOT NULL,
  user_id     uuid        NOT NULL,
  guardian_id uuid,
  nisn        text,
  fullname    text        NOT NULL,
  grade       text,
  unit        text,
  status      text        DEFAULT 'Aktif',
  gender      text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT students_guardian_id_fkey FOREIGN KEY (guardian_id)
    REFERENCES public.guardians (id) ON DELETE SET NULL,
  CONSTRAINT students_gender_check
    CHECK (gender = ANY (ARRAY['Laki-laki'::text, 'Perempuan'::text])),
  CONSTRAINT students_status_check
    CHECK (status = ANY (ARRAY['Aktif'::text, 'Lulus'::text, 'Keluar'::text])),
  CONSTRAINT students_unit_check
    CHECK (unit = ANY (ARRAY['TK'::text, 'SD'::text, 'SMP'::text, 'SMA'::text, 'LPI'::text]))
);

ALTER TABLE public.students OWNER TO postgres;
CREATE INDEX IF NOT EXISTS idx_students_guardian_id ON public.students (guardian_id);
CREATE INDEX IF NOT EXISTS idx_students_status      ON public.students (status);


-- ============================================================
-- TABEL: invoices (tagihan SPP)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id             uuid        DEFAULT gen_random_uuid() NOT NULL,
  student_id     uuid,
  description    text        NOT NULL,
  amount         numeric     NOT NULL,
  status         text        DEFAULT 'UNPAID' NOT NULL,
  payment_method text,
  external_id    text,
  snap_token     text,
  checkout_url   text,
  due_date       timestamptz DEFAULT (now() + interval '7 days'),
  created_at     timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id)
    REFERENCES public.students (id) ON DELETE CASCADE
);

ALTER TABLE public.invoices OWNER TO postgres;
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON public.invoices (student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON public.invoices (status);


-- ============================================================
-- ROW LEVEL SECURITY
-- Single-tenant: authenticated = akses penuh
-- ============================================================

ALTER TABLE public.schools   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices  ENABLE ROW LEVEL SECURITY;

-- schools
CREATE POLICY "Authenticated read school" ON public.schools
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated update school" ON public.schools
  FOR UPDATE TO authenticated USING (true);

-- ── users ─────────────────────────────────────────────────────
-- Semua authenticated boleh baca (profil sendiri maupun daftar)
CREATE POLICY "Users: read all" ON public.users
  FOR SELECT TO authenticated USING (true);

-- Admin dan sistem boleh insert profil baru (termasuk wali murid)
CREATE POLICY "Users: admin insert" ON public.users
  FOR INSERT TO authenticated WITH CHECK (
    public.my_role() = ANY (ARRAY['admin', 'guru', 'tendik'])
  );

-- Siapapun boleh update profil sendiri; admin boleh update semua
CREATE POLICY "Users: update own or admin" ON public.users
  FOR UPDATE TO authenticated USING (
    id = auth.uid() OR public.my_role() = 'admin'
  );

-- Hanya admin yang boleh hapus profil
CREATE POLICY "Users: admin delete" ON public.users
  FOR DELETE TO authenticated USING (public.my_role() = 'admin');


-- ── guardians ─────────────────────────────────────────────────
-- Semua authenticated boleh baca
CREATE POLICY "Guardians: read all" ON public.guardians
  FOR SELECT TO authenticated USING (true);

-- Hanya admin/guru/tendik yang bisa tambah & ubah
CREATE POLICY "Guardians: staff insert" ON public.guardians
  FOR INSERT TO authenticated WITH CHECK (
    public.my_role() = ANY (ARRAY['admin', 'guru', 'tendik'])
  );

CREATE POLICY "Guardians: staff update" ON public.guardians
  FOR UPDATE TO authenticated USING (
    public.my_role() = ANY (ARRAY['admin', 'guru', 'tendik'])
  );

-- Hanya admin yang boleh hapus
CREATE POLICY "Guardians: admin delete" ON public.guardians
  FOR DELETE TO authenticated USING (public.my_role() = 'admin');


-- ── students ──────────────────────────────────────────────────
-- Semua authenticated boleh baca
CREATE POLICY "Students: read all" ON public.students
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Students: staff insert" ON public.students
  FOR INSERT TO authenticated WITH CHECK (
    public.my_role() = ANY (ARRAY['admin', 'guru', 'tendik'])
  );

CREATE POLICY "Students: staff update" ON public.students
  FOR UPDATE TO authenticated USING (
    public.my_role() = ANY (ARRAY['admin', 'guru', 'tendik'])
  );

CREATE POLICY "Students: admin delete" ON public.students
  FOR DELETE TO authenticated USING (public.my_role() = 'admin');


-- ── invoices ──────────────────────────────────────────────────
-- Semua authenticated boleh baca
CREATE POLICY "Invoices: read all" ON public.invoices
  FOR SELECT TO authenticated USING (true);

-- Hanya admin yang bisa buat & ubah tagihan
CREATE POLICY "Invoices: admin insert" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (public.my_role() = 'admin');

CREATE POLICY "Invoices: admin update" ON public.invoices
  FOR UPDATE TO authenticated USING (public.my_role() = 'admin');

CREATE POLICY "Invoices: admin delete" ON public.invoices
  FOR DELETE TO authenticated USING (public.my_role() = 'admin');


-- ============================================================
-- GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON TABLE public.schools   TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users     TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.guardians TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.students  TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.invoices  TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.my_role()              TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
