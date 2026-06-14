import { supabase } from '../lib/supabase';

export interface Client {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  type: 'PF' | 'PJ';
  status: 'active' | 'inactive' | 'lead';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientContact {
  id?: string;
  client_id?: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
}

export interface ClientAddress {
  id?: string;
  client_id?: string;
  zip_code: string | null;
  street: string;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  is_primary: boolean;
}

export const clientService = {
  // Buscar todos os clientes (com paginação e busca opcional)
  async getClients(search?: string) {
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,document.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Client[];
  },

  // Buscar cliente por ID com seus contatos e endereços
  async getClientById(id: string) {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (clientError) throw clientError;

    const { data: contacts } = await supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', id);

    const { data: addresses } = await supabase
      .from('client_addresses')
      .select('*')
      .eq('client_id', id);

    return {
      ...client,
      contacts: contacts || [],
      addresses: addresses || []
    };
  },

  // Criar novo cliente
  async createClient(clientData: Partial<Client>, contacts: ClientContact[], addresses: ClientAddress[]) {
    // A trigger no DB já adiciona o company_id automaticamente graças ao default que definimos
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (clientError) throw clientError;

    // Inserir contatos
    if (contacts.length > 0) {
      const contactsToInsert = contacts.map(c => ({ ...c, client_id: newClient.id }));
      const { error: contactsError } = await supabase.from('client_contacts').insert(contactsToInsert);
      if (contactsError) console.error('Erro ao inserir contatos:', contactsError);
    }

    // Inserir endereços
    if (addresses.length > 0) {
      const addressesToInsert = addresses.map(a => ({ ...a, client_id: newClient.id }));
      const { error: addressesError } = await supabase.from('client_addresses').insert(addressesToInsert);
      if (addressesError) console.error('Erro ao inserir endereços:', addressesError);
    }

    return newClient;
  },

  // Atualizar cliente
  async updateClient(id: string, clientData: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...clientData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar cliente
  async deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
