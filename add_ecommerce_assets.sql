
-- Migration to add E-Commerce Asset fields to products table

ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_condition_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS composition_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS composition_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS indication_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS indication_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS side_effects_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS side_effects_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags_filters TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS suggested_filters TEXT;
