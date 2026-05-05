-- Add document_url to financial_transactions
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS document_url TEXT;
