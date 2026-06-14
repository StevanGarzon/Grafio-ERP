import { supabase } from '../lib/supabase';

export interface Contract {
  id: string;
  company_id: string;
  client_id: string;
  title: string;
  value: number;
  frequency: string;
  status: string;
  next_billing_date: string | null;
  auto_generate_visit: boolean;
  created_at: string;
  client?: { name: string };
}

export const contractService = {
  async getContracts() {
    const { data, error } = await supabase
      .from('contracts')
      .select('*, client:clients(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Contract[];
  },

  async createContract(contract: any) {
    try {
      // Usar a sessão do auth para garantir que o ID é o correto
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error('Empresa não encontrada no perfil do usuário.');
      }

      console.log('Tentando salvar contrato para empresa:', profile.company_id);

      const cleanData = {
        title: contract.title,
        client_id: contract.client_id,
        company_id: profile.company_id,
        value: parseFloat(contract.value),
        frequency: contract.frequency || 'Mensal',
        next_billing_date: contract.next_billing_date || null,
        status: 'Ativo'
      };

      const { data, error } = await supabase
        .from('contracts')
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        console.error('Erro no Supabase:', error);
        throw new Error(`Erro no Banco (RLS): ${error.message}. Verifique as permissões da tabela contracts.`);
      }
      return data;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Erro ao cadastrar contrato.');
    }
  },

  async updateContract(id: string, updates: Partial<Contract>) {
    const { data, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteContract(id: string) {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
