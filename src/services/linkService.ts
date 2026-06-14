import { supabase } from '../lib/supabase';

export interface Link {
  id: string;
  company_id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  created_at: string;
}

export const linkService = {
  async getLinks() {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return data as Link[];
  },

  async createLink(link: Partial<Link>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('links')
      .insert({ ...link, company_id: profile?.company_id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLink(id: string, updates: Partial<Link>) {
    const { error } = await supabase
      .from('links')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteLink(id: string) {
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
