
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { documentService, DocumentLink } from '@/services/documentService';
import { Edit } from 'lucide-react';

interface DocumentEditDialogProps {
  document: DocumentLink;
  onDocumentUpdated: (updatedDocument: DocumentLink) => void;
}

const DocumentEditDialog = ({ document, onDocumentUpdated }: DocumentEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: document.title,
    description: document.description || '',
    file_url: document.file_url,
    file_type: document.file_type,
    education_level: document.education_level,
    uploaded_by: document.uploaded_by || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.file_url) {
      toast({
        title: "Error",
        description: "Title and file URL are required",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.file_url);
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const updatedDocument: DocumentLink = {
        ...document,
        ...formData,
        description: formData.description || null,
        uploaded_by: formData.uploaded_by || null,
        updated_at: new Date().toISOString()
      };

      await documentService.updateDocument(document.id, formData);
      onDocumentUpdated(updatedDocument);
      
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="Edit document"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="text-sm font-medium mb-2 block">
              Document Title *
            </label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter document title"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-file_type" className="text-sm font-medium mb-2 block">
                File Type
              </label>
              <Select 
                value={formData.file_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, file_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc">DOC</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                  <SelectItem value="txt">TXT</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="edit-education_level" className="text-sm font-medium mb-2 block">
                Education Level
              </label>
              <Select 
                value={formData.education_level} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, education_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="senior_high">Senior High School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="edit-file_url" className="text-sm font-medium mb-2 block">
              File URL *
            </label>
            <Input
              id="edit-file_url"
              type="url"
              value={formData.file_url}
              onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
              placeholder="https://example.com/document.pdf"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="text-sm font-medium mb-2 block">
              Description
            </label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description of the document"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="edit-uploaded_by" className="text-sm font-medium mb-2 block">
              Uploaded By
            </label>
            <Input
              id="edit-uploaded_by"
              value={formData.uploaded_by}
              onChange={(e) => setFormData(prev => ({ ...prev, uploaded_by: e.target.value }))}
              placeholder="Name (optional)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentEditDialog;
