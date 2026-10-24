-- ==============================================================================
-- ROBOLLAB STUDIO - USER CUSTOM LIBRARIES (SUPABASE SETUP & FIX)
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Buat tabel jika belum ada
CREATE TABLE IF NOT EXISTS public.user_custom_libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('github', 'zip', 'arduino_index')),
    source_url TEXT,
    version TEXT DEFAULT '1.0.0',
    headers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 2. Perbaiki tabel yang SUDAH ADA (jika sebelumnya dibuat tanpa UNIQUE / DEFAULT)
-- A. Pastikan kolom id memiliki default gen_random_uuid()
ALTER TABLE public.user_custom_libraries 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- B. Pastikan kolom created_at memiliki default now()
ALTER TABLE public.user_custom_libraries 
  ALTER COLUMN created_at SET DEFAULT now();

-- C. Pastikan kolom headers memiliki default array JSON kosong
ALTER TABLE public.user_custom_libraries 
  ALTER COLUMN headers SET DEFAULT '[]'::jsonb;

-- D. PENTING: Tambahkan UNIQUE constraint pada (user_id, name)
-- Ini WAJIB ada agar query upsert { onConflict: 'user_id, name' } dari RoboLab berhasil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_custom_libraries_user_id_name_key'
  ) THEN
    ALTER TABLE public.user_custom_libraries 
      ADD CONSTRAINT user_custom_libraries_user_id_name_key UNIQUE (user_id, name);
  END IF;
END $$;

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.user_custom_libraries ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan Akses: Pengguna yang login dapat membaca, menambah, mengubah, dan menghapus library miliknya sendiri
DROP POLICY IF EXISTS "Users can manage their custom libraries" ON public.user_custom_libraries;
CREATE POLICY "Users can manage their custom libraries"
ON public.user_custom_libraries
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Kebijakan Cadangan (Fallback untuk public/anon key jika user menggunakan mode lokal/anonim)
DROP POLICY IF EXISTS "Anon can insert custom libraries" ON public.user_custom_libraries;
CREATE POLICY "Anon can insert custom libraries"
ON public.user_custom_libraries
FOR ALL
TO anon
USING (true)
WITH CHECK (true);
