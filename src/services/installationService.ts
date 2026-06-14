import { supabase } from '../lib/supabase';

export interface Installation {
  id: string;
  company_id: string;
  client_name: string;
  address: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  team_members: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  image_url?: string;
  order_id?: string;
  created_at: string;
}

export const installationService = {
  async getInstallations(startDate?: string, endDate?: string) {
    let query = supabase
      .from('installations')
      .select('*')
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (startDate) query = query.gte('scheduled_date', startDate);
    if (endDate) query = query.lte('scheduled_date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data as Installation[];
  },

  async createInstallation(inst: Partial<Installation>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('installations')
      .insert({ ...inst, company_id: profile?.company_id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateInstallation(id: string, updates: Partial<Installation>) {
    const { error } = await supabase
      .from('installations')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteInstallation(id: string) {
    const { error } = await supabase
      .from('installations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadImage(file: File, installationId: string) {
    const ext = file.name.split('.').pop();
    const path = `installations/${installationId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    return publicUrl;
  }
};
