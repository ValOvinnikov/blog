-- Custom SQL migration file, put your code below! --
-- Enables pgvector — needed by M3.4's semantic-search embeddings index.
-- No feature tables reference it yet; this bootstrap (#984) only turns the
-- extension on so a later migration can add a `vector` column.
CREATE EXTENSION IF NOT EXISTS vector;
