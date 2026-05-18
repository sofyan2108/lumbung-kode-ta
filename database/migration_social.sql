-- ============================================
-- SOCIAL FEATURES: Database Migration
-- Lumbung Kode - Comments, Leaderboard, Stats
-- ============================================

-- Run these SQL statements in Supabase SQL Editor
-- Order matters! Do not skip steps.

-- ============================================
-- STEP 1: Create Comments Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS comments_snippet_id_idx ON comments(snippet_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

COMMENT ON TABLE comments IS 'User comments on public snippets';

-- ============================================
-- STEP 2: RLS Policies for Comments
-- ============================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Semua orang bisa baca komentar di snippet publik
DROP POLICY IF EXISTS "Anyone can read comments on public snippets" ON comments;
CREATE POLICY "Anyone can read comments on public snippets"
ON comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM snippets
    WHERE snippets.id = comments.snippet_id
    AND snippets.is_public = true
  )
);

-- User bisa membaca komentar di snippet miliknya sendiri (termasuk privat)
DROP POLICY IF EXISTS "Owner can read comments on own snippets" ON comments;
CREATE POLICY "Owner can read comments on own snippets"
ON comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM snippets
    WHERE snippets.id = comments.snippet_id
    AND snippets.user_id = auth.uid()
  )
);

-- User yang login bisa menambah komentar di snippet publik
DROP POLICY IF EXISTS "Authenticated users can comment on public snippets" ON comments;
CREATE POLICY "Authenticated users can comment on public snippets"
ON comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM snippets
    WHERE snippets.id = comments.snippet_id
    AND snippets.is_public = true
  )
);

-- User hanya bisa hapus komentar miliknya sendiri
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);

-- User hanya bisa update komentar miliknya sendiri
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- STEP 3: RPC Function — Leaderboard
-- ============================================

-- Drop old versions to prevent "function not unique" error due to overloading
DROP FUNCTION IF EXISTS get_leaderboard(INTEGER);
DROP FUNCTION IF EXISTS get_leaderboard(INTEGER, TEXT);

CREATE OR REPLACE FUNCTION get_leaderboard(lim INTEGER DEFAULT 20, sort_by TEXT DEFAULT 'score')
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  total_snippets BIGINT,
  total_likes BIGINT,
  total_copies BIGINT,
  total_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.full_name,
    COALESCE(s.snippet_count, 0) AS total_snippets,
    COALESCE(s.like_sum, 0) AS total_likes,
    COALESCE(s.copy_sum, 0) AS total_copies,
    (COALESCE(s.snippet_count, 0) + COALESCE(s.like_sum, 0) + COALESCE(s.copy_sum, 0)) AS total_score
  FROM profiles p
  LEFT JOIN (
    SELECT
      sn.user_id AS sn_user_id,
      COUNT(sn.id) AS snippet_count,
      SUM(COALESCE(sn.like_count, 0)) AS like_sum,
      SUM(COALESCE(sn.copy_count, 0)) AS copy_sum
    FROM snippets sn
    WHERE sn.is_public = true
    GROUP BY sn.user_id
  ) s ON s.sn_user_id = p.id
  WHERE COALESCE(s.snippet_count, 0) > 0
  ORDER BY 
    CASE WHEN sort_by = 'snippets' THEN COALESCE(s.snippet_count, 0) END DESC,
    CASE WHEN sort_by = 'likes' THEN COALESCE(s.like_sum, 0) END DESC,
    CASE WHEN sort_by = 'copies' THEN COALESCE(s.copy_sum, 0) END DESC,
    CASE WHEN sort_by = 'score' THEN (COALESCE(s.snippet_count, 0) + COALESCE(s.like_sum, 0) + COALESCE(s.copy_sum, 0)) END DESC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_leaderboard(INTEGER, TEXT) IS 'Returns top contributors ranked by dynamically chosen metric, default score (snippets*5 + likes*3 + copies*1)';

-- ============================================
-- STEP 4: RPC Function — User Stats
-- ============================================

DROP FUNCTION IF EXISTS get_user_stats(UUID);

CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID)
RETURNS TABLE (
  total_snippets BIGINT,
  total_public_snippets BIGINT,
  total_likes BIGINT,
  total_copies BIGINT,
  total_comments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(s.id) AS total_snippets,
    COUNT(s.id) FILTER (WHERE s.is_public = true) AS total_public_snippets,
    SUM(COALESCE(s.like_count, 0)) AS total_likes,
    SUM(COALESCE(s.copy_count, 0)) AS total_copies,
    (SELECT COUNT(*) FROM comments c WHERE c.user_id = target_user_id) AS total_comments
  FROM snippets s
  WHERE s.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_stats IS 'Returns contribution statistics for a specific user';

-- ============================================
-- STEP 5: RPC Function — Comment Count per Snippet
-- ============================================

CREATE OR REPLACE FUNCTION get_comment_count(target_snippet_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM comments WHERE snippet_id = target_snippet_id;
$$ LANGUAGE sql STABLE;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'comments';

SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_leaderboard', 'get_user_stats', 'get_comment_count');
