import { supabase } from '../lib/supabase';

export interface Supplier {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  categories: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export const supplierService = {
  async getSuppliers(search?: string) {
    let query = supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Supplier[];
  },

  async getSupplierById(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Supplier;
  },

  async createSupplier(supplier: Partial<Supplier>) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSupplier(id: string, supplier: Partial<Supplier>) {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ ...supplier, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSupplier(id: string) {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
