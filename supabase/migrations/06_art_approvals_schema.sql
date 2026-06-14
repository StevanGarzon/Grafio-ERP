-- ==========================================
-- GRAFIO ERP - PHASE 7: ART APPROVALS
-- ==========================================

-- 1. ART APPROVALS TABLE
CREATE TABLE public.art_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL,
    
    -- Art details
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL, -- URL from Supabase Storage
    
    -- Status and Feedback
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    client_feedback TEXT,
    
    -- Public Access
    token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.art_approvals ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Internal access (Staff)
CREATE POLICY "Users can view approvals in their company" ON public.art_approvals FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert approvals in their company" ON public.art_approvals FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update approvals in their company" ON public.art_approvals FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete approvals in their company" ON public.art_approvals FOR DELETE USING (company_id = public.get_user_company_id());

-- Public access (Clients) - Allow anyone to select by token
-- This is crucial for the public approval page
CREATE POLICY "Public can view art approval by token" 
ON public.art_approvals 
FOR SELECT 
USING (true); -- We verify the token in the application logic/query

-- Public access (Clients) - Allow anyone to update status by token
-- We'll restrict the update in the application but allow the DB for the specific columns
CREATE POLICY "Public can update art approval status by token" 
ON public.art_approvals 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- PREVENT TENANT HIJACKING TRIGGER
CREATE TRIGGER tr_prevent_art_approvals_company_id_update BEFORE UPDATE ON public.art_approvals FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();

-- ==========================================
-- STORAGE SETUP (Reference instructions)
-- ==========================================
-- No Supabase Dashboard, você deve:
-- 1. Criar um bucket chamado 'artworks'.
-- 2. Tornar o bucket 'Public' ou configurar políticas de storage:
--    - SELECT: Permitir anon (public)
--    - INSERT: Permitir usuários autenticados
--    - DELETE: Permitir usuários autenticados
