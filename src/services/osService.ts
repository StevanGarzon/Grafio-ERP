import { supabase } from '../lib/supabase';
import type { Client } from './clientService';
import type { Quote } from './quoteService';
import type { Product } from './productService';

export interface ServiceOrderItem {
  id?: string;
  service_order_id?: string;
  product_id: string | null;
  description: string;
  quantity: number;
  production_details: string | null;
  product?: Product;
}

export type OSStatus = 'pending' | 'production' | 'finishing' | 'ready' | 'delivered' | 'cancelled';

export interface ServiceOrder {
  id: string;
  client_id: string;
  quote_id: string | null;
  number: number;
  status: OSStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  delivery_date: string | null;
  description: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  quote?: Quote;
  items?: ServiceOrderItem[];
}

export const osService = {
  async getServiceOrders(status?: OSStatus, search?: string) {
    let query = supabase
      .from('service_orders')
      .select('*, client:clients(id, name, document, type)')
      .order('delivery_date', { ascending: true, nullsFirst: false }); // Prioritize closer deadlines

    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    let result = data as any[];
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(os => 
        os.number?.toString().includes(lowerSearch) || 
        os.client?.name?.toLowerCase().includes(lowerSearch) ||
        os.description?.toLowerCase().includes(lowerSearch)
      );
    }

    return result;
  },

  async getServiceOrderById(id: string) {
    const { data: os, error: osError } = await supabase
      .from('service_orders')
      .select('*, client:clients(*), quote:quotes(id, number)')
      .eq('id', id)
      .single();

    if (osError) throw osError;

    const { data: items, error: itemsError } = await supabase
      .from('service_order_items')
      .select('*, product:products(name, unit)')
      .eq('service_order_id', id);

    if (itemsError) throw itemsError;

    return {
      ...os,
      items: items || []
    } as ServiceOrder;
  },

  async createServiceOrder(osData: Partial<ServiceOrder>, items: ServiceOrderItem[]) {
    const { data: newOS, error: osError } = await supabase
      .from('service_orders')
      .insert({
        client_id: osData.client_id,
        quote_id: osData.quote_id,
        status: osData.status || 'pending',
        priority: osData.priority || 'normal',
        delivery_date: osData.delivery_date,
        description: osData.description,
        internal_notes: osData.internal_notes
      })
      .select()
      .single();

    if (osError) throw osError;

    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        service_order_id: newOS.id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        production_details: item.production_details
      }));

      const { error: itemsError } = await supabase
        .from('service_order_items')
        .insert(itemsToInsert);

      if (itemsError) console.error('Erro ao inserir itens da OS:', itemsError);
    }

    // If it came from a quote, we might want to update the quote status to 'approved' if not already
    if (osData.quote_id) {
        await supabase.from('quotes').update({ status: 'approved' }).eq('id', osData.quote_id);
    }

    return newOS;
  },

  async updateServiceOrderStatus(id: string, status: OSStatus) {
    const { data, error } = await supabase
      .from('service_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteServiceOrder(id: string) {
    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async convertQuoteToOS(quoteId: string) {
    // 1. Check if OS already exists for this quote to avoid duplicates
    const { data: existing } = await supabase
      .from('service_orders')
      .select('id')
      .eq('quote_id', quoteId)
      .maybeSingle();
    
    if (existing) return existing;

    // 2. Fetch Quote and its Items
    const { data: quote, error: qErr } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();
    
    if (qErr) throw qErr;

    const { data: items, error: iErr } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId);
    
    if (iErr) throw iErr;

    // 3. Create the OS
    const { data: newOS, error: osErr } = await supabase
      .from('service_orders')
      .insert({
        client_id: quote.client_id,
        quote_id: quote.id,
        status: 'pending',
        priority: 'normal',
        description: `Ref. Orçamento #${quote.number}`,
        internal_notes: quote.internal_notes
      })
      .select()
      .single();
    
    if (osErr) throw osErr;

    // 4. Create OS Items
    if (items && items.length > 0) {
      const osItems = items.map(item => ({
        service_order_id: newOS.id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        production_details: 'Importado do Orçamento'
      }));

      await supabase.from('service_order_items').insert(osItems);
    }

    return newOS;
  }
};
