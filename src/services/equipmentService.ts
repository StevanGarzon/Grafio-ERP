import { supabase } from '../lib/supabase';
import { sanitizePayload } from '../utils/security';

export interface Equipment {
  id: string;
  company_id: string;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  purchase_date: string | null;
  status: 'Operacional' | 'Manutenção' | 'Inativo';
  created_at: string;
  updated_at: string;
  last_log?: MaintenanceLog | null;
}

export interface MaintenanceLog {
  id: string;
  equipment_id: string;
  company_id?: string;
  description: string;
  maintenance_type: 'Preventiva' | 'Corretiva' | 'Troca de Peça';
  cost: number;
  performed_at: string;
  next_due_date: string | null;
  parts_replaced: string | null;
  created_at: string;
}

export const equipmentService = {
  async getEquipment() {
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        maintenance_logs (
          performed_at,
          next_due_date,
          description
        )
      `)
      .order('name', { ascending: true });

    if (error) throw error;
    
    // Processar para pegar apenas a última manutenção de cada máquina
    return data.map(m => ({
      ...m,
      last_log: m.maintenance_logs?.sort((a: any, b: any) => 
        new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
      )[0]
    })) as any[];
  },

  async createEquipment(equipment: Partial<Equipment>) {
    try {
      // Buscar o company_id do usuário atual
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .single();

      if (profileError || !profile?.company_id) {
        console.error('Perfil não encontrado:', profileError);
        throw new Error('Não foi possível identificar sua empresa. Por favor, faça login novamente.');
      }

      // Preparar os dados (campos que estão dando erro no cache foram removidos temporariamente)
      const cleanData = sanitizePayload({
        name: equipment.name,
        type: equipment.type,
        status: equipment.status || 'Operacional',
        company_id: profile.company_id
      });

      const { data, error } = await supabase
        .from('equipment')
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        console.error('Erro técnico no Supabase:', error);
        throw new Error(`Erro no Banco (Supabase): ${error.message} - ${error.details || ''}`);
      }
      
      return data;
    } catch (err: any) {
      console.error('Erro ao cadastrar:', err);
      throw new Error(err.message || 'Erro desconhecido ao cadastrar equipamento.');
    }
  },

  async updateEquipment(id: string, updates: Partial<Equipment>) {
    const sanitizedUpdates = sanitizePayload(updates);
    const { data, error } = await supabase
      .from('equipment')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEquipment(id: string) {
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMaintenanceLogs(equipmentId: string) {
    const { data, error } = await supabase
      .from('maintenance_logs')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('performed_at', { ascending: false });

    if (error) throw error;
    return data as MaintenanceLog[];
  },

  async addMaintenanceLog(log: Partial<MaintenanceLog>) {
    try {
      const sanitizedLog = sanitizePayload(log);
      const { data, error } = await supabase
        .from('maintenance_logs')
        .insert({
          ...sanitizedLog,
          next_due_date: sanitizedLog.next_due_date || null
        })
        .select()
        .single();

      if (error) {
        console.error('Erro no log de manutenção:', error);
        throw new Error(`Erro no Banco (Supabase): ${error.message}`);
      }
      return data;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Erro ao registrar manutenção.');
    }
  }
};
