-- Create company_assets table
CREATE TABLE IF NOT EXISTS public.company_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    valor DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create company_investments table
CREATE TABLE IF NOT EXISTS public.company_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    aporte DECIMAL(12, 2) NOT NULL DEFAULT 0,
    rendimento_pct DECIMAL(5, 2) NOT NULL DEFAULT 0,
    data_aporte DATE NOT NULL DEFAULT CURRENT_DATE,
    saldo_atual DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create company_employees table
CREATE TABLE IF NOT EXISTS public.company_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    salario DECIMAL(12, 2) NOT NULL DEFAULT 0,
    inss DECIMAL(12, 2) NOT NULL DEFAULT 0,
    fgts DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente')),
    vencimento DATE NOT NULL,
    email TEXT,
    telefone TEXT,
    data_admissao DATE,
    cpf TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create company_valuation_config table
CREATE TABLE IF NOT EXISTS public.company_valuation_config (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    metodo TEXT NOT NULL DEFAULT 'multiplos',
    faturamento12m DECIMAL(15, 2) NOT NULL DEFAULT 0,
    lucro_liquido DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ativos_circulantes DECIMAL(15, 2) NOT NULL DEFAULT 0,
    passivos DECIMAL(15, 2) NOT NULL DEFAULT 0,
    taxa_crescimento DECIMAL(5, 2) NOT NULL DEFAULT 0,
    setor TEXT NOT NULL DEFAULT 'Tecnologia / SaaS',
    wacc DECIMAL(5, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE public.company_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_valuation_config ENABLE ROW LEVEL SECURITY;

-- Policies for company_assets
CREATE POLICY "Users can view own assets" ON public.company_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON public.company_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.company_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.company_assets FOR DELETE USING (auth.uid() = user_id);

-- Policies for company_investments
CREATE POLICY "Users can view own investments" ON public.company_investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investments" ON public.company_investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investments" ON public.company_investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investments" ON public.company_investments FOR DELETE USING (auth.uid() = user_id);

-- Policies for company_employees
CREATE POLICY "Users can view own employees" ON public.company_employees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own employees" ON public.company_employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employees" ON public.company_employees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employees" ON public.company_employees FOR DELETE USING (auth.uid() = user_id);

-- Policies for company_valuation_config
CREATE POLICY "Users can view own valuation_config" ON public.company_valuation_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own valuation_config" ON public.company_valuation_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own valuation_config" ON public.company_valuation_config FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_investments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_valuation_config;
