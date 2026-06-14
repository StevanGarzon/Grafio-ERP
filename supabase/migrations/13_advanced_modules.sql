-- ==========================================
-- GRAFIO ERP - PHASE 13: ADVANCED INDUSTRIAL OPERATIONS & CRM
-- ==========================================

-- 1. CRM PIPELINES & LEADS
CREATE TABLE public.crm_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    title TEXT NOT NULL,
    value DECIMAL(15, 2) DEFAULT 0,
    stage TEXT CHECK (stage IN ('lead', 'contacted', 'quote_sent', 'negotiating', 'pending_approval', 'production', 'delivered', 'won', 'lost')) DEFAULT 'lead',
    notes TEXT,
    inactive_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.crm_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'whatsapp', 'email', 'phone', 'meeting'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

-- 2. PRODUCT COMPOSITIONS & VARIATIONS
CREATE TABLE public.product_compositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    material_cost DECIMAL(15, 2) DEFAULT 0,
    man_hour_cost DECIMAL(15, 2) DEFAULT 0,
    machine_hour_cost DECIMAL(15, 2) DEFAULT 0,
    margin_pct DECIMAL(5, 2) DEFAULT 20.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.product_compositions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    composition_id UUID REFERENCES public.product_compositions(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Ex: "Adesivo Fosco", "ACM Escovado"
    cost_modifier DECIMAL(15, 2) DEFAULT 0,
    time_modifier INTEGER DEFAULT 0
);
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- 3. RH & LABOUR HOUR-MAN CONTROLLER
CREATE TABLE public.rh_colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    base_salary DECIMAL(15, 2) NOT NULL,
    charges_pct DECIMAL(5, 2) DEFAULT 40.00, -- 60% Mão de obra / 40% Estrutura
    productive_hours_monthly INTEGER DEFAULT 160,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.rh_colaboradores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rh_hora_homem_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES public.rh_colaboradores(id) ON DELETE CASCADE,
    activity TEXT NOT NULL,
    minutes_logged INTEGER NOT NULL,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE public.rh_hora_homem_logs ENABLE ROW LEVEL SECURITY;

-- 4. FISCAL MODULE LOGS & CERTIFICATES
CREATE TABLE public.fiscal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    doc_type TEXT CHECK (doc_type IN ('NFe', 'NFSe', 'NFCe', 'MDFe')) NOT NULL,
    doc_number TEXT NOT NULL,
    status TEXT CHECK (status IN ('draft', 'transmitted', 'corrected', 'cancelled')) DEFAULT 'draft',
    xml_payload TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;

-- 5. GOVERNANCE & SWOT STRATEGY
CREATE TABLE public.strategic_okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    target_value DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.strategic_okrs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
CREATE POLICY "Users can crm in company" ON public.crm_opportunities FOR ALL USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can crm_inter in company" ON public.crm_interactions FOR ALL USING (opportunity_id IN (SELECT id FROM public.crm_opportunities));
CREATE POLICY "Users can comps in company" ON public.product_compositions FOR ALL USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can variations in company" ON public.product_variations FOR ALL USING (composition_id IN (SELECT id FROM public.product_compositions));
CREATE POLICY "Users can rh in company" ON public.rh_colaboradores FOR ALL USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can rh_logs in company" ON public.rh_hora_homem_logs FOR ALL USING (colaborador_id IN (SELECT id FROM public.rh_colaboradores));
CREATE POLICY "Users can fiscal in company" ON public.fiscal_documents FOR ALL USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can okrs in company" ON public.strategic_okrs FOR ALL USING (company_id = public.get_user_company_id());
