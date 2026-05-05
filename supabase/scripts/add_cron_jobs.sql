-- Tabel konfigurasi cron job
-- Jalankan script ini di Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.cron_jobs (
  id                           uuid        DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name                         text        NOT NULL,
  description                  text,
  job_type                     text        NOT NULL DEFAULT 'generate_spp_invoices',
  schedule_day                 integer     NOT NULL CHECK (schedule_day BETWEEN 1 AND 28),
  invoice_description_template text        NOT NULL DEFAULT 'SPP Bulan {MONTH} {YEAR}',
  due_date_offset_days         integer     NOT NULL DEFAULT 14,
  is_active                    boolean     NOT NULL DEFAULT true,
  last_run_at                  timestamptz,
  last_run_status              text,
  last_run_count               integer,
  last_run_message             text,
  created_at                   timestamptz DEFAULT now()
);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.cron_jobs ENABLE ROW LEVEL SECURITY;

-- Semua authenticated boleh baca (untuk dashboard info)
CREATE POLICY "Cron Jobs: read all" ON public.cron_jobs
  FOR SELECT TO authenticated USING (true);

-- Hanya admin yang bisa kelola cron job
CREATE POLICY "Cron Jobs: admin insert" ON public.cron_jobs
  FOR INSERT TO authenticated WITH CHECK (public.my_role() = 'admin');

CREATE POLICY "Cron Jobs: admin update" ON public.cron_jobs
  FOR UPDATE TO authenticated USING (public.my_role() = 'admin');

CREATE POLICY "Cron Jobs: admin delete" ON public.cron_jobs
  FOR DELETE TO authenticated USING (public.my_role() = 'admin');
