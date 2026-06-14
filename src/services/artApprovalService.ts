import { supabase } from '../lib/supabase';
import type { Client } from './clientService';
import type { ServiceOrder } from './osService';

export interface ArtApproval {
  id: string;
  client_id: string;
  service_order_id: string | null;
  title: string;
  description: string | null;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  client_feedback: string | null;
  token: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  service_order?: ServiceOrder;
}

export const artApprovalService = {
  // Internal methods (Auth required)
  async getApprovals(search?: string) {
    let query = supabase
      .from('art_approvals')
      .select('*, client:clients(name)')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    
    let result = data as any[];
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(lower) || 
        a.client?.name?.toLowerCase().includes(lower)
      );
    }

    return result;
  },

  async createApproval(approvalData: Partial<ArtApproval>, imageFile: File) {
    // 1. Upload image to Storage
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `approvals/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('artworks')
      .getPublicUrl(filePath);

    // 3. Create DB record
    const { data, error } = await supabase
      .from('art_approvals')
      .insert({
        ...approvalData,
        image_url: publicUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Public methods (No Auth required, uses token)
  async getByToken(token: string) {
    const { data, error } = await supabase
      .from('art_approvals')
      .select('*, company:companies(name)')
      .eq('token', token)
      .single();

    if (error) throw error;
    return data as any;
  },

  async respond(token: string, status: 'approved' | 'rejected', feedback: string) {
    // 1. Atualiza o status da aprovação
    const { data, error } = await supabase
      .from('art_approvals')
      .update({ 
        status, 
        client_feedback: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('token', token)
      .select('*, service_order_id')
      .single();

    if (error) throw error;

    // 2. Se for aprovado e tiver uma OS vinculada, muda o status da OS para 'production'
    if (status === 'approved' && data.service_order_id) {
      await supabase
        .from('service_orders')
        .update({ status: 'production' })
        .eq('id', data.service_order_id);
    }

    return data;
  }
};
