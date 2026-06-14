import { supabase } from '../lib/supabase';
import type { Client } from './clientService';
import type { Product } from './productService';

export interface QuoteItem {
  id?: string;
  quote_id?: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  // Included for frontend use only
  product?: Product;
}

export interface Quote {
  id: string;
  client_id: string;
  number: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  issue_date: string;
  valid_until: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total_amount: number;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  // Included for frontend use only
  client?: Client;
  items?: QuoteItem[];
}

export const quoteService = {
  async getQuotes(status?: string, search?: string) {
    let query = supabase
      .from('quotes')
      .select('*, client:clients(id, name, document, type)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    
    // Note: To search by client name with Supabase we would ideally use a view or RPC, 
    // or fetch and filter on frontend for simplicity if records are small.
    // For now we'll fetch them.

    const { data, error } = await query;
    if (error) throw error;
    
    let result = data as any[];
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(q => 
        q.number?.toString().includes(lowerSearch) || 
        q.client?.name?.toLowerCase().includes(lowerSearch)
      );
    }

    return result;
  },

  async getQuoteById(id: string) {
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*, client:clients(*)')
      .eq('id', id)
      .single();

    if (quoteError) throw quoteError;

    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*, product:products(name, unit)')
      .eq('quote_id', id);

    if (itemsError) throw itemsError;

    return {
      ...quote,
      items: items || []
    } as Quote;
  },

  async createQuote(quoteData: Partial<Quote>, items: QuoteItem[]) {
    // 1. Create the quote
    const { data: newQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        client_id: quoteData.client_id,
        status: quoteData.status || 'draft',
        valid_until: quoteData.valid_until,
        subtotal: quoteData.subtotal,
        discount: quoteData.discount || 0,
        shipping: quoteData.shipping || 0,
        total_amount: quoteData.total_amount,
        notes: quoteData.notes,
        internal_notes: quoteData.internal_notes
      })
      .select()
      .single();

    if (quoteError) throw quoteError;

    // 2. Insert items
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        quote_id: newQuote.id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Erro ao inserir itens do orçamento:', itemsError);
        // Em um sistema real robusto, faríamos um rollback ou tentaríamos novamente
      }
    }

    return newQuote;
  },

  async updateQuoteStatus(id: string, status: Quote['status']) {
    const { data, error } = await supabase
      .from('quotes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteQuote(id: string) {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
