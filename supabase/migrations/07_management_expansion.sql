-- Migration 07: Management Expansion (GED and Notes)

-- Table for Documents (GED)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    file_type TEXT,
    category TEXT DEFAULT 'Geral',
    size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Quick Notes
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    color TEXT DEFAULT '#3366ff',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policies for Documents
CREATE POLICY "Users can view company documents" ON public.documents
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert company documents" ON public.documents
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete company documents" ON public.documents
    FOR DELETE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for Notes
CREATE POLICY "Users can view company notes" ON public.notes
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert company notes" ON public.notes
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update company notes" ON public.notes
    FOR UPDATE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete company notes" ON public.notes
    FOR DELETE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER set_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
