-- Add contract validity fields to leads and opportunities
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE;

ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE;
