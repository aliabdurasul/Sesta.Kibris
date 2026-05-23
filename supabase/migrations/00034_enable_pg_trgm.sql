-- Migration: 00034_enable_pg_trgm
-- Enable fuzzy text search extensions required by the Global Product Catalog system.
--
-- pg_trgm : trigram-based similarity for duplicate product detection in
--           product_suggestions (auto-populates similarity_score + duplicate_of).
-- unaccent : strips diacritics/accents so Turkish chars (ç ğ ı ö ş ü) are
--            normalised before similarity comparison, reducing false negatives.
--
-- Both extensions are included in Supabase's default Postgres image.
-- Running twice is safe (IF NOT EXISTS).

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
