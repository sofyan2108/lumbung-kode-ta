-- ============================================
-- TIER 1 UPGRADE: Database Migration
-- CodeHaven - Collections & Enhanced Metadata
-- ============================================

-- Run these SQL statements in Supabase SQL Editor
-- Order matters! Do not skip steps.

-- ============================================
-- STEP 1: Create Collections Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);
CREATE INDEX IF NOT EXISTS collections_created_at_idx ON collections(created_at DESC);

COMMENT ON TABLE collections IS 'User-created collections/folders for organizing snippets';

-- ============================================
-- STEP 2: RLS Policies for Collections
-- ============================================

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Users can read their own collections
CREATE POLICY "Users can read own collections"
ON collections FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own collections
CREATE POLICY "Users can insert own collections"
ON collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own collections
CREATE POLICY "Users can update own collections"
ON collections FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own collections
CREATE POLICY "Users can delete own collections"
ON collections FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- STEP 3: Junction Table (Many-to-Many)
-- ============================================

CREATE TABLE IF NOT EXISTS public.snippet_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snippet_id, collection_id)
);

-- Indexes for bi-directional queries
CREATE INDEX IF NOT EXISTS snippet_collections_snippet_idx ON snippet_collections(snippet_id);
CREATE INDEX IF NOT EXISTS snippet_collections_collection_idx ON snippet_collections(collection_id);

COMMENT ON TABLE snippet_collections IS 'Junction table linking snippets to collections (many-to-many)';

-- ============================================
-- STEP 4: RLS Policies for Junction Table
-- ============================================

ALTER TABLE snippet_collections ENABLE ROW LEVEL SECURITY;

-- Users can read if they own the collection
CREATE POLICY "Users can read own snippet_collections"
ON snippet_collections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = snippet_collections.collection_id
    AND collections.user_id = auth.uid()
  )
);

-- Users can insert if they own both snippet and collection
CREATE POLICY "Users can insert own snippet_collections"
ON snippet_collections FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = snippet_collections.collection_id
    AND collections.user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM snippets
    WHERE snippets.id = snippet_collections.snippet_id
    AND snippets.user_id = auth.uid()
  )
);

-- Users can delete if they own the collection
CREATE POLICY "Users can delete own snippet_collections"
ON snippet_collections FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = snippet_collections.collection_id
    AND collections.user_id = auth.uid()
  )
);

-- ============================================
-- STEP 5: Extend Snippets Table
-- ============================================

-- Add new metadata columns
ALTER TABLE snippets 
ADD COLUMN IF NOT EXISTS dependencies TEXT[],
ADD COLUMN IF NOT EXISTS usage_example TEXT,
ADD COLUMN IF NOT EXISTS related_snippet_ids UUID[],
ADD COLUMN IF NOT EXISTS documentation_url TEXT,
ADD COLUMN IF NOT EXISTS search_vector tsvector;

COMMENT ON COLUMN snippets.dependencies IS 'Array of package names (e.g., ["react", "axios"])';
COMMENT ON COLUMN snippets.usage_example IS 'Code example showing how to use this snippet';
COMMENT ON COLUMN snippets.related_snippet_ids IS 'Array of related snippet UUIDs';
COMMENT ON COLUMN snippets.documentation_url IS 'External documentation link';
COMMENT ON COLUMN snippets.search_vector IS 'Full-text search index';

-- ============================================
-- STEP 6: Full-Text Search Setup
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
-- STEP 7: Backfill Search Vector
-- ============================================

-- Update existing snippets to populate search_vector
-- We update the code column to itself to trigger the search vector update
UPDATE snippets 
SET code = code 
WHERE search_vector IS NULL;

-- ============================================
-- STEP 8: Helper Function - Get Collection Count
-- ============================================

CREATE OR REPLACE FUNCTION get_collection_snippet_count(collection_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM snippet_collections
  WHERE collection_id = collection_uuid;
$$ LANGUAGE sql STABLE;

-- ============================================
-- STEP 9: Helper Function - Remove Snippet from All Collections
-- ============================================

CREATE OR REPLACE FUNCTION remove_snippet_from_collections(snippet_uuid UUID)
RETURNS VOID AS $$
  DELETE FROM snippet_collections
  WHERE snippet_id = snippet_uuid;
$$ LANGUAGE sql;

-- ============================================
-- STEP 10: Create Default Collection for Existing Users
-- ============================================

-- Optional: Create "All Snippets" collection for each user
INSERT INTO collections (user_id, name, description, icon, color)
SELECT 
  id,
  'All Snippets',
  'Default collection for all your code snippets',
  '📚',
  '#8b5cf6'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM collections WHERE collections.user_id = profiles.id
)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('collections', 'snippet_collections');

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('collections', 'snippet_collections', 'snippets')
AND indexname LIKE '%collection%' OR indexname LIKE '%search%';

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('collections', 'snippet_collections');

-- Count collections per user
SELECT 
  p.full_name,
  COUNT(c.id) as collection_count
FROM profiles p
LEFT JOIN collections c ON c.user_id = p.id
GROUP BY p.id, p.full_name;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

/*
-- Uncomment to rollback changes:

DROP TRIGGER IF EXISTS snippets_search_update ON snippets;
DROP FUNCTION IF EXISTS snippets_search_trigger();
DROP FUNCTION IF EXISTS get_collection_snippet_count(UUID);
DROP FUNCTION IF EXISTS remove_snippet_from_collections(UUID);

DROP TABLE IF EXISTS snippet_collections CASCADE;
DROP TABLE IF EXISTS collections CASCADE;

ALTER TABLE snippets 
DROP COLUMN IF EXISTS dependencies,
DROP COLUMN IF EXISTS usage_example,
DROP COLUMN IF EXISTS related_snippet_ids,
DROP COLUMN IF EXISTS documentation_url,
DROP COLUMN IF EXISTS search_vector;
*/
