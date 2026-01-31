
-- ADD EXTENDED VENDOR FIELDS

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS cr_expiry_date date;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS contact_person_name text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS mobile_number text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS fax text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS email_address text;

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS invoice_currency text DEFAULT 'SAR';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'SAR';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS payment_method text;

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS ship_to text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS bill_to text;

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS bank_branch text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS branch_address text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS swift_code text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS bank_account_number text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS iban_number text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS supplier_name_in_bank text;

-- Ensure RLS allows vendors to update their own record
DROP POLICY IF EXISTS "Vendors can update own profile" ON public.vendors;
CREATE POLICY "Vendors can update own profile" ON public.vendors
FOR UPDATE
USING (
   contact_person_id = auth.uid()
)
WITH CHECK (
   contact_person_id = auth.uid()
);
