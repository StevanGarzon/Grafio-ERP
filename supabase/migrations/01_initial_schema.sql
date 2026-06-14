-- ==========================================
-- GRAFIO ERP - INITIAL SCHEMA & MULTI-TENANT
-- ==========================================

-- Enable pgcrypto for UUIDs if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. COMPANIES (Tenants)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    document TEXT, -- CNPJ/CPF
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. USER ROLES (RBAC)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'user', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. HELPER FUNCTIONS FOR RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND company_id = public.get_user_company_id() 
        AND role IN ('admin', 'superadmin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'superadmin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. TRIGGER TO AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    new_company_id UUID;
BEGIN
    -- For now, create a new company for every new signup (Self-Serve SaaS)
    INSERT INTO public.companies (name) VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa')) RETURNING id INTO new_company_id;
    
    INSERT INTO public.profiles (id, company_id, full_name)
    VALUES (NEW.id, new_company_id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (NEW.id, new_company_id, 'admin');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- CRM MODULE SCHEMA
-- ==========================================

-- 6. CLIENTS
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document TEXT UNIQUE, -- CPF ou CNPJ
    email TEXT,
    phone TEXT,
    type TEXT CHECK (type IN ('PF', 'PJ')) DEFAULT 'PJ',
    status TEXT CHECK (status IN ('active', 'inactive', 'lead')) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 7. CLIENT CONTACTS
CREATE TABLE public.client_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    email TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

-- 8. CLIENT ADDRESSES
CREATE TABLE public.client_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    zip_code TEXT,
    street TEXT NOT NULL,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- COMPANIES
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (id = public.get_user_company_id() OR public.is_superadmin());
CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE USING (id = public.get_user_company_id() AND public.is_admin());

-- PROFILES
CREATE POLICY "Users can view profiles in their company" ON public.profiles FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_superadmin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- USER ROLES
CREATE POLICY "Users can view roles in their company" ON public.user_roles FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_superadmin());

-- CLIENTS
CREATE POLICY "Users can view clients in their company" ON public.clients FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert clients in their company" ON public.clients FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update clients in their company" ON public.clients FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete clients in their company" ON public.clients FOR DELETE USING (company_id = public.get_user_company_id());

-- CLIENT CONTACTS
CREATE POLICY "Users can view contacts in their company" ON public.client_contacts FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert contacts in their company" ON public.client_contacts FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update contacts in their company" ON public.client_contacts FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete contacts in their company" ON public.client_contacts FOR DELETE USING (company_id = public.get_user_company_id());

-- CLIENT ADDRESSES
CREATE POLICY "Users can view addresses in their company" ON public.client_addresses FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert addresses in their company" ON public.client_addresses FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update addresses in their company" ON public.client_addresses FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete addresses in their company" ON public.client_addresses FOR DELETE USING (company_id = public.get_user_company_id());

-- PREVENT TENANT HIJACKING TRIGGER
CREATE OR REPLACE FUNCTION public.prevent_company_id_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.company_id IS NOT NULL AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN
        RAISE EXCEPTION 'A alteração de company_id não é permitida por motivos de segurança (Multi-Tenant Isolation).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_prevent_profile_company_id_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
CREATE TRIGGER tr_prevent_clients_company_id_update BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
