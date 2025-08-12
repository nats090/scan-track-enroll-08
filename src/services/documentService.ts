
import { supabase } from '@/integrations/supabase/client';

export interface DocumentLink {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  education_level: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  uploaded_at?: string;
}

export const documentService = {
  async getDocuments(): Promise<DocumentLink[]> {
    const { data, error } = await supabase
      .from('document_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    return data?.map(doc => ({
      ...doc,
      education_level: doc.education_level || 'general'
    })) || [];
  },

  async addDocument(document: Omit<DocumentLink, 'id' | 'created_at' | 'updated_at'>): Promise<DocumentLink> {
    const { data, error } = await supabase
      .from('document_links')
      .insert({
        ...document,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding document:', error);
      throw error;
    }

    return {
      ...data,
      education_level: data.education_level || 'general'
    };
  },

  async updateDocument(id: string, updates: Partial<Omit<DocumentLink, 'id' | 'created_at' | 'updated_at'>>): Promise<DocumentLink> {
    const { data, error } = await supabase
      .from('document_links')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      throw error;
    }

    return {
      ...data,
      education_level: data.education_level || 'general'
    };
  },

  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('document_links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  async searchDocuments(searchTerm: string, educationLevel?: string): Promise<DocumentLink[]> {
    let query = supabase
      .from('document_links')
      .select('*');

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,uploaded_by.ilike.%${searchTerm}%`);
    }

    if (educationLevel && educationLevel !== 'all') {
      query = query.eq('education_level', educationLevel);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error searching documents:', error);
      throw error;
    }

    return data?.map(doc => ({
      ...doc,
      education_level: doc.education_level || 'general'
    })) || [];
  }
};
