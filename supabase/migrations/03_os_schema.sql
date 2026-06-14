-- ==========================================
-- GRAFIO ERP - PHASE 4: SERVICE ORDERS (OS)
-- ==========================================

-- 1. SERVICE ORDERS
CREATE TABLE public.service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    number SERIAL, -- Auto-increment
    status TEXT CHECK (status IN ('pending', 'production', 'finishing', 'ready', 'delivered', 'cancelled')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    delivery_date DATE,
    description TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- 2. SERVICE ORDER ITEMS
CREATE TABLE public.service_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    production_details TEXT, -- Especificações técnicas e acabamentos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- SERVICE ORDERS
CREATE POLICY "Users can view service orders in their company" ON public.service_orders FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert service orders in their company" ON public.service_orders FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update service orders in their company" ON public.service_orders FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete service orders in their company" ON public.service_orders FOR DELETE USING (company_id = public.get_user_company_id());

-- SERVICE ORDER ITEMS
CREATE POLICY "Users can view service order items in their company" ON public.service_order_items FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert service order items in their company" ON public.service_order_items FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update service order items in their company" ON public.service_order_items FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete service order items in their company" ON public.service_order_items FOR DELETE USING (company_id = public.get_user_company_id());

-- PREVENT TENANT HIJACKING TRIGGER
CREATE TRIGGER tr_prevent_service_orders_company_id_update BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
CREATE TRIGGER tr_prevent_service_order_items_company_id_update BEFORE UPDATE ON public.service_order_items FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
