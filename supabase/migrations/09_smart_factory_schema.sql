-- Migration 09: Smart Factory (Equipment and Maintenance)

-- Table for Equipment (Assets)
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Plotter, Router, Impressora UV, Impressora Solvente, Laser
    brand TEXT,
    model TEXT,
    purchase_date DATE,
    status TEXT DEFAULT 'Operacional', -- Operacional, Manutenção, Inativo
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Maintenance Logs
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    maintenance_type TEXT DEFAULT 'Preventiva', -- Preventiva, Corretiva, Troca de Peça
    cost DECIMAL(12,2) DEFAULT 0,
    performed_at DATE DEFAULT current_date,
    next_due_date DATE,
    parts_replaced TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Equipment
CREATE POLICY "Users can view company equipment" ON public.equipment
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage company equipment" ON public.equipment
    FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for Maintenance Logs
CREATE POLICY "Users can view company maintenance logs" ON public.maintenance_logs
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage company maintenance logs" ON public.maintenance_logs
    FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER set_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
