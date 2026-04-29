-- Create financial_transactions table
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own transactions" ON public.financial_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.financial_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.financial_transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.financial_transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_lead_id ON public.financial_transactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_vencimento ON public.financial_transactions(vencimento);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;
