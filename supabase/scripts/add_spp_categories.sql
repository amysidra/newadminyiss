-- Tabel kategori SPP
-- Jalankan script ini di Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.spp_categories (
  id          uuid        DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name        text        NOT NULL,
  amount      numeric     NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);

-- Tambah kolom kategori SPP ke tabel students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS spp_category_id uuid
  REFERENCES public.spp_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_spp_category_id ON public.students (spp_category_id);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.spp_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SPP Categories: read all" ON public.spp_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "SPP Categories: staff insert" ON public.spp_categories
  FOR INSERT TO authenticated WITH CHECK (
    public.my_role() = ANY (ARRAY['admin', 'guru', 'tendik'])
  );

CREATE POLICY "SPP Categories: staff update" ON public.spp_categories
  FOR UPDATE TO authenticated USING (
    public.my_role() = ANY (ARRAY['admin', 'guru', 'tendik'])
  );

CREATE POLICY "SPP Categories: admin delete" ON public.spp_categories
  FOR DELETE TO authenticated USING (public.my_role() = 'admin');
