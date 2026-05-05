-- Add prolabore to company_employees
ALTER TABLE public.company_employees ADD COLUMN IF NOT EXISTS prolabore DECIMAL(12, 2) NOT NULL DEFAULT 0;
