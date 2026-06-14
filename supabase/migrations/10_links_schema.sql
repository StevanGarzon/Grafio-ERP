-- Migration 10: Links Schema

-- Table for Useful Links
CREATE TABLE IF NOT EXISTS public.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT DEFAULT 'Geral',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Policies for Links
CREATE POLICY "Users can view company links" ON public.links
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert company links" ON public.links
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update company links" ON public.links
    FOR UPDATE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete company links" ON public.links
    FOR DELETE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER set_links_updated_at BEFORE UPDATE ON public.links FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Prevent tenant hijacking
CREATE TRIGGER tr_prevent_links_company_id_update BEFORE UPDATE ON public.links FOR EACH ROW EXECUTE FUNCTION public.prevent_company_id_update();
