import { supabase } from '../lib/supabase';

export interface Document {
  id: string;
  company_id: string;
  name: string;
  url: string;
  file_type: string;
  category: string;
  size_bytes: number;
  created_at: string;
}

export const documentService = {
  async getDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Document[];
  },

  async uploadDocument(file: File, category: string = 'Geral') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) throw new Error('Empresa não encontrada.');

    // 1. Upload para o Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${profile.company_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro no Storage:', uploadError);
      throw new Error(`Erro no Armazenamento: ${uploadError.message}. Verifique se o bucket "documents" existe e se as políticas de RLS de Storage estão configuradas.`);
    }

    // 2. Pegar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // 3. Salvar metadados no banco
    const { data, error } = await supabase
      .from('documents')
      .insert({
        company_id: profile.company_id,
        name: file.name,
        url: publicUrl,
        file_type: file.type,
        category: category,
        size_bytes: file.size
      })
      .select()
      .single();

    if (error) {
      console.error('Erro no Banco (Metadados):', error);
      throw new Error(`Erro ao salvar metadados: ${error.message}`);
    }
    return data;
  },

  async updateDocument(id: string, updates: Partial<Document>) {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDocument(id: string, url: string) {
    // 1. Extrair path do Storage a partir da URL
    const pathParts = url.split('/storage/v1/object/public/documents/');
    const filePath = pathParts[1];

    if (filePath) {
      await supabase.storage
        .from('documents')
        .remove([filePath]);
    }

    // 2. Deletar do banco
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
