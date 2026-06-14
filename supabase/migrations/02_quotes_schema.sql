-- ==========================================
-- GRAFIO ERP - PHASE 3: PRODUCTS & QUOTES
-- ==========================================

-- 1. PRODUCTS & SERVICES
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    category TEXT,
    unit TEXT DEFAULT 'un', -- m², un, hr, mt
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. QUOTES (Orçamentos)
CREATE TABLE public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    number SERIAL, -- Auto-increment number per company (simplified for now, ideally handled via a function per tenant)
    status TEXT CHECK (status IN ('draft', 'sent', 'approved', 'rejected')) DEFAULT 'draft',
    issue_date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) DEFAULT 0.00,
    shipping DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 3. QUOTE ITEMS
CREATE TABLE public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL, -- Copied from product or typed manually
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- quantity * unit_price
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- PRODUCTS
CREATE POLICY "Users can view products in their company" ON public.products FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert products in their company" ON public.products FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update products in their company" ON public.products FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete products in their company" ON public.products FOR DELETE USING (company_id = public.get_user_company_id());

-- QUOTES
CREATE POLICY "Users can view quotes in their company" ON public.quotes FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert quotes in their company" ON public.quotes FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update quotes in their company" ON public.quotes FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete quotes in their company" ON public.quotes FOR DELETE USING (company_id = public.get_user_company_id());

-- QUOTE ITEMS
CREATE POLICY "Users can view quote items in their company" ON public.quote_items FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert quote items in their company" ON public.quote_items FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update quote items in their company" ON public.quote_items FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete quote items in their company" ON public.quote_items FOR DELETE USING (company_id = public.get_user_company_id());

-- PREVENT TENANT HIJACKING TRIGGER
CREATE TRIGGER tr_prevent_products_company_id_update BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
CREATE TRIGGER tr_prevent_quotes_company_id_update BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
CREATE TRIGGER tr_prevent_quote_items_company_id_update BEFORE UPDATE ON public.quote_items FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
