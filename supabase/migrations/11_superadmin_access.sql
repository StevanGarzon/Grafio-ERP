-- =======================================================
-- GRAFIO ERP - PHASE 11: SUPERADMIN RLS BYPASS CAPABILITIES
-- =======================================================

-- 1. Drop existing policies on sensitive tables to recreate them securely
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Admins can update their company" ON public.companies;

DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view roles in their company" ON public.user_roles;

-- 2. Define explicit secure policies for public.companies
CREATE POLICY "Select company policy" ON public.companies 
    FOR SELECT USING (id = public.get_user_company_id() OR public.is_superadmin());

CREATE POLICY "Update company policy" ON public.companies 
    FOR UPDATE USING ((id = public.get_user_company_id() AND public.is_admin()) OR public.is_superadmin());

CREATE POLICY "All other company actions superadmin only" ON public.companies 
    FOR ALL USING (public.is_superadmin());

-- 3. Define explicit secure policies for public.profiles
CREATE POLICY "Select profiles policy" ON public.profiles 
    FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_superadmin());

CREATE POLICY "Update profiles policy" ON public.profiles 
    FOR UPDATE USING (id = auth.uid() OR public.is_superadmin());

CREATE POLICY "Insert profiles policy" ON public.profiles 
    FOR INSERT WITH CHECK (id = auth.uid() OR public.is_superadmin());

CREATE POLICY "Delete profiles policy" ON public.profiles 
    FOR DELETE USING (public.is_superadmin());

-- 4. Define explicit secure policies for public.user_roles (prevents privilege escalation)
CREATE POLICY "Select user_roles policy" ON public.user_roles 
    FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_superadmin());

CREATE POLICY "Insert user_roles policy" ON public.user_roles 
    FOR INSERT WITH CHECK ((company_id = public.get_user_company_id() AND public.is_admin()) OR public.is_superadmin());

CREATE POLICY "Update user_roles policy" ON public.user_roles 
    FOR UPDATE USING ((company_id = public.get_user_company_id() AND public.is_admin()) OR public.is_superadmin());

CREATE POLICY "Delete user_roles policy" ON public.user_roles 
    FOR DELETE USING ((company_id = public.get_user_company_id() AND public.is_admin()) OR public.is_superadmin());

-- 5. Dynamically drop and rebuild RLS policies for all other multi-tenant tables
DO $$
DECLARE
    r RECORD;
    policy_rec RECORD;
    table_name TEXT;
BEGIN
    -- Loop and drop all current policies on other public tables to avoid name collisions
    FOR policy_rec IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('companies', 'profiles', 'user_roles')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_rec.policyname) || ' ON public.' || quote_ident(policy_rec.tablename);
    END LOOP;

    -- Loop over all tables that contain a company_id column, excluding sensitive system ones
    FOR r IN 
        SELECT c.table_name
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        WHERE c.table_schema = 'public' 
        AND c.column_name = 'company_id'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT IN ('companies', 'profiles', 'user_roles')
    LOOP
        table_name := r.table_name;
        
        -- Create policies for SELECT, INSERT, UPDATE, DELETE supporting company_id OR superadmin
        EXECUTE 'CREATE POLICY "Select ' || table_name || ' policy" ON public.' || quote_ident(table_name) || 
                ' FOR SELECT USING (company_id = public.get_user_company_id() OR public.is_superadmin())';
                
        EXECUTE 'CREATE POLICY "Insert ' || table_name || ' policy" ON public.' || quote_ident(table_name) || 
                ' FOR INSERT WITH CHECK (company_id = public.get_user_company_id() OR public.is_superadmin())';
                
        EXECUTE 'CREATE POLICY "Update ' || table_name || ' policy" ON public.' || quote_ident(table_name) || 
                ' FOR UPDATE USING (company_id = public.get_user_company_id() OR public.is_superadmin())';
                
        EXECUTE 'CREATE POLICY "Delete ' || table_name || ' policy" ON public.' || quote_ident(table_name) || 
                ' FOR DELETE USING (company_id = public.get_user_company_id() OR public.is_superadmin())';
    END LOOP;
END;
$$;
