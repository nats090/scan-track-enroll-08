
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { documentService } from '@/services/documentService';
import { Upload } from 'lucide-react';

interface DocumentUploadFormProps {
  onDocumentAdded: () => void;
}

const DocumentUploadForm = ({ onDocumentAdded }: DocumentUploadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: '',
    file_type: 'pdf',
    education_level: 'senior_high',
    department: 'ABM',
    uploaded_by: ''
  });

  const getDepartmentOptions = () => {
    if (formData.education_level === 'college') {
      return [
        { value: 'CECE', label: 'CECE (Civil Engineering & Computer Engineering)' },
        { value: 'CTELAN', label: 'CTELAN (Teacher Education & Liberal Arts)' },
        { value: 'CBA', label: 'CBA (College of Business Administration)' }
      ];
    } else if (formData.education_level === 'senior_high') {
      return [
        { value: 'ABM', label: 'ABM (Accountancy, Business & Management)' },
        { value: 'STEM', label: 'STEM (Science, Technology, Engineering & Mathematics)' },
        { value: 'HUMSS', label: 'HUMSS (Humanities & Social Sciences)' },
        { value: 'GAS', label: 'GAS (General Academic Strand)' },
        { value: 'TVL-ICT', label: 'TVL-ICT (Information & Communications Technology)' },
        { value: 'TVL-HE', label: 'TVL-HE (Home Economics)' },
        { value: 'TVL-IA', label: 'TVL-IA (Industrial Arts)' }
      ];
    }
    return [{ value: 'general', label: 'General' }];
  };

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
      await documentService.addDocument({
        ...formData,
        // Store department in description field for now (since we don't have a department field in the table)
        description: formData.department ? `${formData.description}\n\nDepartment/Strand: ${formData.department}` : formData.description
      });

      setFormData({
        title: '',
        description: '',
        file_url: '',
        file_type: 'pdf',
        education_level: 'senior_high',
        department: 'ABM',
        uploaded_by: ''
      });

      toast({
        title: "Success",
        description: "Document link added successfully",
      });

      onDocumentAdded();
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        title: "Error",
        description: "Failed to add document link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEducationLevelChange = (value: string) => {
    const newDepartment = value === 'college' ? 'CECE' : 'ABM';
    setFormData(prev => ({ 
      ...prev, 
      education_level: value, 
      department: newDepartment 
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Add Document Link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium mb-2 block">
                Document Title *
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter document title"
                required
              />
            </div>
            
            <div>
              <label htmlFor="education_level" className="text-sm font-medium mb-2 block">
                Education Level *
              </label>
              <Select 
                value={formData.education_level} 
                onValueChange={handleEducationLevelChange}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="text-sm font-medium mb-2 block">
                {formData.education_level === 'senior_high' ? 'Strand' : 'Department'}
              </label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getDepartmentOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="file_type" className="text-sm font-medium mb-2 block">
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
          </div>

          <div>
            <label htmlFor="uploaded_by" className="text-sm font-medium mb-2 block">
              Uploaded By
            </label>
            <Input
              id="uploaded_by"
              value={formData.uploaded_by}
              onChange={(e) => setFormData(prev => ({ ...prev, uploaded_by: e.target.value }))}
              placeholder="Your name (optional)"
            />
          </div>

          <div>
            <label htmlFor="file_url" className="text-sm font-medium mb-2 block">
              File URL *
            </label>
            <Input
              id="file_url"
              type="url"
              value={formData.file_url}
              onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
              placeholder="https://example.com/document.pdf"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium mb-2 block">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description of the document"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding...' : 'Add Document Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DocumentUploadForm;
