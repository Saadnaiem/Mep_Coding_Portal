-- Add columns for Vendor Documents (URLs)

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS cr_document_url text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS vat_certificate_url text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS bank_certificate_url text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS catalog_url text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS other_documents_url text;
