-- Adiciona colunas faltantes na tabela public.leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

-- Garante que o cache do PostgREST seja atualizado
NOTIFY pgrst, 'reload schema';
