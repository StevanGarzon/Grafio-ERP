-- ==========================================
-- GRAFIO ERP - PHASE 5: INVENTORY & SUPPLIERS
-- ==========================================

-- 1. SUPPLIERS (Fornecedores)
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document TEXT UNIQUE, -- CNPJ/CPF
    email TEXT,
    phone TEXT,
    categories TEXT, -- Ex: "Lonas, Tintas, Ferragens"
    notes TEXT,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 2. INVENTORY ITEMS (Matéria-Prima / Almoxarifado)
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    unit TEXT DEFAULT 'un', -- m², un, lts, kg
    current_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    min_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    last_cost_price DECIMAL(10, 2) DEFAULT 0.00,
    location TEXT, -- Corredor/Prateleira
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- 3. INVENTORY TRANSACTIONS (Log de Entradas/Saídas)
CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('in', 'out', 'adjustment')) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL, -- Valores positivos
    unit_cost DECIMAL(10, 2), -- Custo unitário na entrada
    reason TEXT, -- Motivo (ex: "Compra NF 123", "Produção OS 500")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- SUPPLIERS
CREATE POLICY "Users can view suppliers in their company" ON public.suppliers FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert suppliers in their company" ON public.suppliers FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update suppliers in their company" ON public.suppliers FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete suppliers in their company" ON public.suppliers FOR DELETE USING (company_id = public.get_user_company_id());

-- INVENTORY ITEMS
CREATE POLICY "Users can view inventory items in their company" ON public.inventory_items FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert inventory items in their company" ON public.inventory_items FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update inventory items in their company" ON public.inventory_items FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete inventory items in their company" ON public.inventory_items FOR DELETE USING (company_id = public.get_user_company_id());

-- INVENTORY TRANSACTIONS
CREATE POLICY "Users can view inventory transactions in their company" ON public.inventory_transactions FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert inventory transactions in their company" ON public.inventory_transactions FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
-- Transactions usually shouldn't be updated or deleted directly to keep a reliable audit log.
-- We can allow updates only by superadmin if necessary, but we'll restrict it here.
CREATE POLICY "Transactions cannot be updated" ON public.inventory_transactions FOR UPDATE USING (false);
CREATE POLICY "Transactions cannot be deleted" ON public.inventory_transactions FOR DELETE USING (false);

-- PREVENT TENANT HIJACKING TRIGGER
CREATE TRIGGER tr_prevent_suppliers_company_id_update BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
CREATE TRIGGER tr_prevent_inventory_items_company_id_update BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();

-- ==========================================
-- AUTOMATIC STOCK UPDATE FUNCTION (TRIGGER)
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'in' THEN
        UPDATE public.inventory_items 
        SET current_quantity = current_quantity + NEW.quantity, 
            last_cost_price = COALESCE(NEW.unit_cost, last_cost_price)
        WHERE id = NEW.item_id;
    ELSIF NEW.type = 'out' THEN
        UPDATE public.inventory_items 
        SET current_quantity = current_quantity - NEW.quantity 
        WHERE id = NEW.item_id;
    ELSIF NEW.type = 'adjustment' THEN
        -- Em ajuste, a quantity na transaction é a variação (pode ser + ou -). 
        -- Mas para simplificar, usaremos 'in' e 'out' primariamente.
        -- Se for ajuste de balanço onde quantity é o saldo final, a lógica seria diferente.
        -- Vamos assumir que adjustment funciona como uma variação:
        UPDATE public.inventory_items 
        SET current_quantity = current_quantity + NEW.quantity 
        WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_stock_after_transaction
AFTER INSERT ON public.inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_stock();
