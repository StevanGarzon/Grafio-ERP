import { supabase } from '../lib/supabase';

export interface Visit {
  id: string;
  company_id: string;
  client_id?: string;
  client_name: string;
  address: string;
  visit_date: string;
  visit_time: string;
  status: 'pending' | 'completed' | 'cancelled';
  contact_info?: string;
  technical_form: any;
  created_at: string;
}

export const visitService = {
  async getVisits() {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .order('visit_date', { ascending: true })
      .order('visit_time', { ascending: true });

    if (error) throw error;
    return data as Visit[];
  },

  async createVisit(visit: Partial<Visit>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('visits')
      .insert({
        ...visit,
        company_id: profile?.company_id,
        status: 'pending',
        technical_form: visit.technical_form || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateVisit(id: string, updates: Partial<Visit>) {
    const { error } = await supabase
      .from('visits')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async getVisitById(id: string) {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Visit;
  },

  async uploadVisitFile(file: File, visitId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${visitId}/${Math.random()}.${fileExt}`;
    const filePath = `visits/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return publicUrl;
  }
};
