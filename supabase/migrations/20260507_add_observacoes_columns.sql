-- Add observacoes column to valuation tables if they don't exist
ALTER TABLE public.company_valuation_config ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.company_valuation_history ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Refresh schema cache instruction (for the user if they run this manually)
-- NOTIFY pgrst, 'reload schema';
