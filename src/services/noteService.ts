import { supabase } from '../lib/supabase';

export interface Note {
  id: string;
  company_id: string;
  user_id: string;
  content: string;
  color: string;
  is_pinned: boolean;
  created_at: string;
}

export const noteService = {
  async getNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Note[];
  },

  async createNote(content: string, color: string = '#3b82f6') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('notes')
      .insert({
        company_id: profile?.company_id,
        user_id: user.id,
        content,
        color,
        is_pinned: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNote(id: string, updates: Partial<Note>) {
    const { error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteNote(id: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
