import { supabase } from '../lib/supabase';
import type { Supplier } from './supplierService';

export interface InventoryItem {
  id: string;
  supplier_id: string | null;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  last_cost_price: number;
  location: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  user_id: string | null;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit_cost: number | null;
  reason: string | null;
  created_at: string;
}

export const inventoryService = {
  async getInventoryItems(search?: string, lowStockOnly = false) {
    let query = supabase
      .from('inventory_items')
      .select('*, supplier:suppliers(name)')
      .order('name', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let items = data as InventoryItem[];
    if (lowStockOnly) {
      items = items.filter(item => item.current_quantity <= item.min_quantity);
    }

    return items;
  },

  async registerTransaction(
    itemId: string, 
    type: 'in' | 'out' | 'adjustment', 
    quantity: number, 
    reason?: string,
    unitCost?: number
  ) {
    // A Trigger `tr_update_stock_after_transaction` no banco cuidará de atualizar a quantidade atual na tabela inventory_items automaticamente!
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert({
        item_id: itemId,
        type,
        quantity,
        reason,
        unit_cost: unitCost
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createInventoryItem(item: Partial<InventoryItem>) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRecentTransactions(limit = 10) {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*, item:inventory_items(name, unit)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
};
