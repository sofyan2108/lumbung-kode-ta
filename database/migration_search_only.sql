-- ============================================
-- SEARCH ONLY MIGRATION
-- Run this if collections already exists
-- ============================================

-- ============================================
-- STEP 1: Extend Snippets Table for Search
-- ============================================

-- Add new metadata columns (IF NOT EXISTS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='snippets' AND column_name='dependencies') THEN
        ALTER TABLE snippets ADD COLUMN dependencies TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='snippets' AND column_name='usage_example') THEN
        ALTER TABLE snippets ADD COLUMN usage_example TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='snippets' AND column_name='related_snippet_ids') THEN
        ALTER TABLE snippets ADD COLUMN related_snippet_ids UUID[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='snippets' AND column_name='documentation_url') THEN
        ALTER TABLE snippets ADD COLUMN documentation_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='snippets' AND column_name='search_vector') THEN
        ALTER TABLE snippets ADD COLUMN search_vector tsvector;
    END IF;
END $$;

COMMENT ON COLUMN snippets.dependencies IS 'Array of package names (e.g., ["react", "axios"])';
COMMENT ON COLUMN snippets.usage_example IS 'Code example showing how to use this snippet';
COMMENT ON COLUMN snippets.related_snippet_ids IS 'Array of related snippet UUIDs';
COMMENT ON COLUMN snippets.documentation_url IS 'External documentation link';
COMMENT ON COLUMN snippets.search_vector IS 'Full-text search index';

-- ============================================
-- STEP 2: Full-Text Search Setup
-- ============================================

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS snippets_search_idx 
ON snippets USING GIN(search_vector);

-- Function to auto-update search vector
CREATE OR REPLACE FUNCTION snippets_search_trigger() 
RETURNS trigger AS $$
BEGIN
  -- Weighted search: title (A) > description (B) > code (C) > tags (D)
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.code, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert/update
DROP TRIGGER IF EXISTS snippets_search_update ON snippets;
CREATE TRIGGER snippets_search_update 
BEFORE INSERT OR UPDATE ON snippets
FOR EACH ROW 
EXECUTE FUNCTION snippets_search_trigger();

-- ============================================
-- STEP 3: Backfill Search Vector
-- ============================================

-- Update existing snippets to populate search_vector
-- This triggers the search vector update for all existing snippets
UPDATE snippets SET code = code WHERE search_vector IS NULL;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if search_vector column exists
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'snippets' 
AND column_name IN ('search_vector', 'dependencies', 'usage_example', 'documentation_url');

-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'snippets_search_update';

-- Count snippets with populated search_vector
SELECT 
  COUNT(*) as total_snippets,
  COUNT(search_vector) as indexed_snippets
FROM snippets;
