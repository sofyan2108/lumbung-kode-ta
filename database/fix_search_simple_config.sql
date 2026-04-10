-- ============================================================
-- FIX: Ganti konfigurasi FTS dari 'english' ke 'simple'
-- 'simple' tidak punya stop words dan stemming → lebih cocok untuk kode
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- Step 1: Update trigger function
CREATE OR REPLACE FUNCTION snippets_search_trigger() 
RETURNS trigger AS $$
BEGIN
  -- 'simple' config: tidak ada stop words, tidak ada stemming
  -- Semua kata diindeks apa adanya (lebih cocok untuk source code)
  NEW.search_vector := 
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.code, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Backfill semua snippet yang sudah ada
-- Trigger akan otomatis dipanggil dan mengisi ulang search_vector
UPDATE snippets SET code = code;

-- Step 3: Verifikasi — cek sample search_vector
SELECT id, title, search_vector IS NOT NULL as is_indexed
FROM snippets
LIMIT 5;
