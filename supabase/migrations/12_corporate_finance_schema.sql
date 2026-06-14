-- ==========================================
-- GRAFIO ERP - PHASE 12: ROBUST CORPORATE FINANCE (ALTERATIONS)
-- ==========================================

-- 1. COST CENTERS (Centros de Custo)
CREATE TABLE public.financial_cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- Ex: "CC-MKT"
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.financial_cost_centers ENABLE ROW LEVEL SECURITY;

-- 2. FINANCIAL ASSETS (Imobilizado & Depreciação)
CREATE TABLE public.financial_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    acquisition_date DATE NOT NULL,
    purchase_value DECIMAL(15, 2) NOT NULL CHECK (purchase_value >= 0),
    residual_value DECIMAL(15, 2) NOT NULL CHECK (residual_value >= 0),
    useful_life_months INTEGER NOT NULL CHECK (useful_life_months > 0),
    accumulated_depreciation DECIMAL(15, 2) DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'disposed')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.financial_assets ENABLE ROW LEVEL SECURITY;

-- 3. FINANCIAL LOANS (Empréstimos & Financiamentos)
CREATE TABLE public.financial_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    contract_number TEXT,
    principal_amount DECIMAL(15, 2) NOT NULL,
    annual_interest_rate DECIMAL(5, 4) NOT NULL,
    installments INTEGER NOT NULL,
    amortization_type TEXT CHECK (amortization_type IN ('SAC', 'PRICE')) NOT NULL,
    start_date DATE NOT NULL,
    status TEXT CHECK (status IN ('active', 'paid_off')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.financial_loans ENABLE ROW LEVEL SECURITY;

-- 4. ALTER EXISTING FINANCIAL TRANSACTIONS TABLE
ALTER TABLE public.financial_transactions
    ADD COLUMN cost_center_id UUID REFERENCES public.financial_cost_centers(id) ON DELETE SET NULL,
    ADD COLUMN cost_classification TEXT CHECK (cost_classification IN ('fixed', 'variable')),
    
    -- Juros, multas e descontos para baixas
    ADD COLUMN penalty_amount DECIMAL(15, 2) DEFAULT 0,
    ADD COLUMN interest_amount DECIMAL(15, 2) DEFAULT 0,
    ADD COLUMN discount_amount DECIMAL(15, 2) DEFAULT 0,
    
    -- Recorrência e Vinculação de impostos/títulos pais
    ADD COLUMN is_recurring BOOLEAN DEFAULT false,
    ADD COLUMN recurrence_interval TEXT CHECK (recurrence_interval IN ('monthly', 'weekly', 'yearly')),
    ADD COLUMN parent_transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
    
    -- Versionamento para controle de concorrência (Optimistic Locking)
    ADD COLUMN version INTEGER DEFAULT 1;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- COST CENTERS
CREATE POLICY "Users can view cost centers in their company" ON public.financial_cost_centers FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert cost centers in their company" ON public.financial_cost_centers FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update cost centers in their company" ON public.financial_cost_centers FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete cost centers in their company" ON public.financial_cost_centers FOR DELETE USING (company_id = public.get_user_company_id());

-- FINANCIAL ASSETS
CREATE POLICY "Users can view assets in their company" ON public.financial_assets FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert assets in their company" ON public.financial_assets FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update assets in their company" ON public.financial_assets FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete assets in their company" ON public.financial_assets FOR DELETE USING (company_id = public.get_user_company_id());

-- FINANCIAL LOANS
CREATE POLICY "Users can view loans in their company" ON public.financial_loans FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert loans in their company" ON public.financial_loans FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update loans in their company" ON public.financial_loans FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete loans in their company" ON public.financial_loans FOR DELETE USING (company_id = public.get_user_company_id());

-- TRIGGERS TO PREVENT HIJACKING
CREATE TRIGGER tr_prevent_fin_cost_centers_company_id_update BEFORE UPDATE ON public.financial_cost_centers FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
CREATE TRIGGER tr_prevent_fin_assets_company_id_update BEFORE UPDATE ON public.financial_assets FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
CREATE TRIGGER tr_prevent_fin_loans_company_id_update BEFORE UPDATE ON public.financial_loans FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
