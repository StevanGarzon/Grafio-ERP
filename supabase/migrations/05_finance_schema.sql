-- ==========================================
-- GRAFIO ERP - PHASE 6: FINANCE
-- ==========================================

-- 1. FINANCIAL ACCOUNTS (Bank accounts, cash registers)
CREATE TABLE public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Ex: "Conta Itaú", "Caixa Loja"
    type TEXT CHECK (type IN ('bank', 'cash', 'credit_card', 'other')) DEFAULT 'bank',
    initial_balance DECIMAL(10, 2) DEFAULT 0.00,
    current_balance DECIMAL(10, 2) DEFAULT 0.00,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

-- 2. FINANCIAL CATEGORIES (Chart of accounts)
CREATE TABLE public.financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    parent_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL, -- Para sub-categorias futuramente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

-- 3. FINANCIAL TRANSACTIONS (Accounts Payable & Receivable)
CREATE TABLE public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT public.get_user_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
    
    -- Tipo: income (receita/a receber) ou expense (despesa/a pagar)
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    
    -- Status
    status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
    
    -- Valores e Datas
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    
    -- Descrição
    description TEXT NOT NULL,
    notes TEXT,
    
    -- Relacionamentos do ERP (Tudo opcional para transações avulsas)
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- FINANCIAL ACCOUNTS
CREATE POLICY "Users can view financial accounts in their company" ON public.financial_accounts FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert financial accounts in their company" ON public.financial_accounts FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update financial accounts in their company" ON public.financial_accounts FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete financial accounts in their company" ON public.financial_accounts FOR DELETE USING (company_id = public.get_user_company_id());

-- FINANCIAL CATEGORIES
CREATE POLICY "Users can view financial categories in their company" ON public.financial_categories FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert financial categories in their company" ON public.financial_categories FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update financial categories in their company" ON public.financial_categories FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete financial categories in their company" ON public.financial_categories FOR DELETE USING (company_id = public.get_user_company_id());

-- FINANCIAL TRANSACTIONS
CREATE POLICY "Users can view financial transactions in their company" ON public.financial_transactions FOR SELECT USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can insert financial transactions in their company" ON public.financial_transactions FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "Users can update financial transactions in their company" ON public.financial_transactions FOR UPDATE USING (company_id = public.get_user_company_id());
CREATE POLICY "Users can delete financial transactions in their company" ON public.financial_transactions FOR DELETE USING (company_id = public.get_user_company_id());

-- PREVENT TENANT HIJACKING TRIGGER
CREATE TRIGGER tr_prevent_fin_accounts_company_id_update BEFORE UPDATE ON public.financial_accounts FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
CREATE TRIGGER tr_prevent_fin_categories_company_id_update BEFORE UPDATE ON public.financial_categories FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
CREATE TRIGGER tr_prevent_fin_transactions_company_id_update BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();

-- ==========================================
-- AUTOMATIC BALANCE UPDATE TRIGGER
-- ==========================================
-- Quando uma transação é paga, ou muda de valor/status, atualiza o saldo da conta.
CREATE OR REPLACE FUNCTION public.update_financial_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Se estiver inserindo ou atualizando para "paid"
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'paid' AND NEW.account_id IS NOT NULL THEN
        -- Se for UPDATE e antes já era pago na mesma conta com o mesmo valor, ignora (evitar duplo hit)
        -- Complex logic for update is simplified here. Em um ERP robusto, nós revertermos o Old e aplicamos o New.
        
        -- Reverte o antigo se era pago
        IF TG_OP = 'UPDATE' AND OLD.status = 'paid' AND OLD.account_id IS NOT NULL THEN
            IF OLD.type = 'income' THEN
                UPDATE public.financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
            ELSE
                UPDATE public.financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
            END IF;
        END IF;

        -- Aplica o novo
        IF NEW.type = 'income' THEN
            UPDATE public.financial_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
        ELSE
            UPDATE public.financial_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
        END IF;
    END IF;

    -- Se deletar uma transação paga
    IF TG_OP = 'DELETE' AND OLD.status = 'paid' AND OLD.account_id IS NOT NULL THEN
        IF OLD.type = 'income' THEN
            UPDATE public.financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
        ELSE
            UPDATE public.financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
        END IF;
    END IF;
    
    -- Se alterar de "paid" para "pending/cancelled"
    IF TG_OP = 'UPDATE' AND OLD.status = 'paid' AND NEW.status != 'paid' AND OLD.account_id IS NOT NULL THEN
        IF OLD.type = 'income' THEN
            UPDATE public.financial_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
        ELSE
            UPDATE public.financial_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_balance_after_transaction
AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_financial_account_balance();

-- Inserir categorias padrões assim que o tenant for criado poderia ser feito, mas por hora o app lida com isso.
