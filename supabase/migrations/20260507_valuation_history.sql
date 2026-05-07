-- Create company_valuation_history table to persist monthly snapshots
CREATE TABLE IF NOT EXISTS public.company_valuation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mes_referencia DATE NOT NULL, -- First day of the month
    metodo TEXT NOT NULL,
    faturamento12m DECIMAL(15, 2) NOT NULL DEFAULT 0,
    lucro_liquido DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ativos_circulantes DECIMAL(15, 2) NOT NULL DEFAULT 0,
    passivos DECIMAL(15, 2) NOT NULL DEFAULT 0,
    taxa_crescimento DECIMAL(5, 2) NOT NULL DEFAULT 0,
    setor TEXT NOT NULL,
    wacc DECIMAL(5, 2) NOT NULL DEFAULT 0,
    valor_calculado DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, mes_referencia)
);

-- Enable RLS
ALTER TABLE public.company_valuation_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own valuation_history" ON public.company_valuation_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own valuation_history" ON public.company_valuation_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own valuation_history" ON public.company_valuation_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own valuation_history" ON public.company_valuation_history FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_valuation_history;
