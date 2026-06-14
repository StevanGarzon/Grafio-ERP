-- Migration 08: Professional Operations (Contracts and Supplier Prices)

-- Table for Maintenance Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    frequency TEXT DEFAULT 'Mensal', -- Mensal, Trimestral, Semestral, Anual
    status TEXT DEFAULT 'Ativo', -- Ativo, Suspenso, Cancelado
    next_billing_date DATE,
    auto_generate_visit BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Supplier Price Comparison
CREATE TABLE IF NOT EXISTS public.supplier_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL, -- Vinil, Lona, ACM, LED, Tinta
    price DECIMAL(12,2) NOT NULL,
    unit TEXT DEFAULT 'm2', -- m2, rolo, un, litro
    last_update DATE DEFAULT current_date,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_prices ENABLE ROW LEVEL SECURITY;

-- Policies for Contracts
CREATE POLICY "Users can view company contracts" ON public.contracts
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage company contracts" ON public.contracts
    FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for Supplier Prices
CREATE POLICY "Users can view company supplier prices" ON public.supplier_prices
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage company supplier prices" ON public.supplier_prices
    FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER set_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
