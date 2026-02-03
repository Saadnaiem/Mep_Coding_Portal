
-- Migration to add Brand Name (AR) to products table

ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_ar TEXT;
