-- SCRIPT PARA CORRIGIR O BANCO DE DADOS NO SUPABASE
-- Copie tudo abaixo e cole no SQL Editor do Supabase

-- 1. Criar tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(12, 2) NOT NULL DEFAULT 0,
    data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
    vencimento DATE NOT NULL,
    recebimento DATE,
    lead_nome TEXT,
    lead_id UUID,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'agendado')),
    categoria TEXT NOT NULL,
    recorrencia TEXT NOT NULL DEFAULT 'unica' CHECK (recorrencia IN ('unica', 'mensal', 'trimestral', 'anual')),
    classificacao TEXT CHECK (classificacao IN ('recorrente', 'nao_recorrente')),
    document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Criar tabelas adicionais do Financeiro
CREATE TABLE IF NOT EXISTS public.company_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    salario DECIMAL(12, 2) NOT NULL DEFAULT 0,
    inss DECIMAL(12, 2) NOT NULL DEFAULT 0,
    fgts DECIMAL(12, 2) NOT NULL DEFAULT 0,
    prolabore DECIMAL(12, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente')),
    vencimento DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_valuation_config (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    metodo TEXT NOT NULL DEFAULT 'multiplos',
    faturamento12m DECIMAL(15, 2) NOT NULL DEFAULT 0,
    lucro_liquido DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ativos_circulantes DECIMAL(15, 2) NOT NULL DEFAULT 0,
    passivos DECIMAL(15, 2) NOT NULL DEFAULT 0,
    taxa_crescimento DECIMAL(5, 2) NOT NULL DEFAULT 0,
    setor TEXT NOT NULL DEFAULT 'Tecnologia / SaaS',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Habilitar Segurança (RLS)
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_valuation_config ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Acesso
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own transactions') THEN
        CREATE POLICY "Users can view own transactions" ON public.financial_transactions FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own transactions" ON public.financial_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own transactions" ON public.financial_transactions FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own transactions" ON public.financial_transactions FOR DELETE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own employees') THEN
        CREATE POLICY "Users can view own employees" ON public.company_employees FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own employees" ON public.company_employees FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own employees" ON public.company_employees FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own employees" ON public.company_employees FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
