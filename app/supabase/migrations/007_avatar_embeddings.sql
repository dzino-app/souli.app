-- Enable pgvector extension for dense search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to avatars (1024 dimensions for NV-Embed-v2)
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS embedding vector(1024) DEFAULT NULL;

-- Add full-text search column for keyword search
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS search_text tsvector DEFAULT NULL;

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_avatars_embedding ON avatars USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- Index for full-text search
CREATE INDEX IF NOT EXISTS idx_avatars_search_text ON avatars USING gin (search_text);

-- Function to update search_text on insert/update
CREATE OR REPLACE FUNCTION update_avatar_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('simple',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.public_description, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_avatar_search_text
  BEFORE INSERT OR UPDATE OF name, public_description, tags ON avatars
  FOR EACH ROW EXECUTE FUNCTION update_avatar_search_text();

COMMENT ON COLUMN avatars.embedding IS 'Dense embedding from NVIDIA NV-Embed-v2 (1024d) for semantic search';
COMMENT ON COLUMN avatars.search_text IS 'Full-text search vector for keyword matching';

-- Hybrid search function: combines full-text keyword score + vector cosine similarity
CREATE OR REPLACE FUNCTION hybrid_search_avatars(
  query_text TEXT,
  query_embedding vector(1024),
  species_filter TEXT DEFAULT NULL,
  match_limit INT DEFAULT 20,
  match_offset INT DEFAULT 0
)
RETURNS SETOF avatars
LANGUAGE sql
STABLE
AS $$
  SELECT a.*
  FROM avatars a
  WHERE a.is_public = true
    AND a.moderation_status = 'approved'
    AND (species_filter IS NULL OR a.appearance->>'species' = species_filter)
    AND (
      a.search_text @@ plainto_tsquery('simple', query_text)
      OR a.name ILIKE '%' || query_text || '%'
      OR a.public_description ILIKE '%' || query_text || '%'
      OR (a.embedding IS NOT NULL AND 1 - (a.embedding <=> query_embedding) > 0.3)
    )
  ORDER BY
    -- Hybrid score: keyword match weight + semantic similarity weight
    (
      CASE WHEN a.search_text @@ plainto_tsquery('simple', query_text) THEN 0.4 ELSE 0 END
      + CASE WHEN a.embedding IS NOT NULL THEN (1 - (a.embedding <=> query_embedding)) * 0.6 ELSE 0 END
    ) DESC,
    a.times_loaded DESC
  LIMIT match_limit
  OFFSET match_offset;
$$;
