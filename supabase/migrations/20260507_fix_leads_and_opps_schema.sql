-- SQL de Reparo de Schema: Leads e Oportunidades
-- Este script garante que todas as colunas necessárias existam e que o cache do Supabase seja atualizado.

-- 1. Reparando a tabela public.leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE,
ADD COLUMN IF NOT EXISTS niche TEXT,
ADD COLUMN IF NOT EXISTS site_url TEXT,
ADD COLUMN IF NOT EXISTS value DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Reparando a tabela public.opportunities
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE,
ADD COLUMN IF NOT EXISTS niche TEXT,
ADD COLUMN IF NOT EXISTS site_url TEXT,
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

-- 3. Forçar recarregamento do cache do PostgREST (Supabase)
-- Isso garante que as novas colunas apareçam imediatamente na API
NOTIFY pgrst, 'reload schema';

-- Comentário informativo: 
-- Se você estiver usando o SQL Editor do Supabase, basta copiar e rodar este bloco inteiro.
