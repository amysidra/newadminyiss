-- Tambah jenjang LPI ke constraint students_unit_check
-- Jalankan di Supabase SQL Editor

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_unit_check;

ALTER TABLE public.students
  ADD CONSTRAINT students_unit_check
  CHECK (unit = ANY (ARRAY['TK'::text, 'SD'::text, 'SMP'::text, 'SMA'::text, 'LPI'::text]));
