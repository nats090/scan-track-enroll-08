import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useLibrary } from '@/contexts/LibraryContext';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Edit, 
  Trash2,
  BookOpen,
  GraduationCap,
  Calendar,
  User,
  Tag
} from 'lucide-react';

interface EnhancedDocument {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  education_level: 'undergraduate' | 'graduate' | 'postgraduate';
  subject_area: string;
  keywords: string[];
  author: string;
  year: number;
  library: 'notre-dame' | 'ibed';
  uploaded_by: string;
  upload_date: Date;
  download_count: number;
  status: 'active' | 'archived' | 'pending';
}

const EnhancedDocumentUpload = () => {
  const [documents, setDocuments] = useState<EnhancedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { currentLibrary } = useLibrary();

  const [newDocument, setNewDocument] = useState<{
    title: string;
    description: string;
    file_url: string;
    file_type: string;
    education_level: 'undergraduate' | 'graduate' | 'postgraduate';
    subject_area: string;
    keywords: string[];
    author: string;
    year: number;
    uploaded_by: string;
  }>({
    title: '',
    description: '',
    file_url: '',
    file_type: 'pdf',
    education_level: 'undergraduate',
    subject_area: '',
    keywords: [],
    author: '',
    year: new Date().getFullYear(),
    uploaded_by: 'Library Staff'
  });

  const subjectAreas = [
    'Computer Science', 'Engineering', 'Business Administration', 'Education',
    'Nursing', 'Psychology', 'Mathematics', 'Sciences', 'Literature',
    'History', 'Social Sciences', 'Philosophy', 'Arts', 'Other'
  ];

  const fileTypes = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'doc', label: 'Word Document' },
    { value: 'docx', label: 'Word Document (DOCX)' },
    { value: 'ppt', label: 'PowerPoint Presentation' },
    { value: 'txt', label: 'Text Document' },
    { value: 'other', label: 'Other' }
  ];

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, [currentLibrary]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would fetch from Supabase
      const mockDocuments: EnhancedDocument[] = [
        {
          id: '1',
          title: 'AI in Healthcare: A Comprehensive Study',
          description: 'Research on artificial intelligence applications in healthcare systems',
          file_url: 'https://example.com/ai-healthcare.pdf',
          file_type: 'pdf',
          education_level: 'graduate',
          subject_area: 'Computer Science',
          keywords: ['AI', 'Healthcare', 'Machine Learning', 'Medical Technology'],
          author: 'Dr. Maria Santos',
          year: 2023,
          library: currentLibrary,
          uploaded_by: 'Library Staff',
          upload_date: new Date('2023-12-01'),
          download_count: 45,
          status: 'active'
        },
        {
          id: '2',
          title: 'Sustainable Business Practices in the Philippines',
          description: 'Analysis of sustainable business models in the Philippine context',
          file_url: 'https://example.com/sustainable-business.pdf',
          file_type: 'pdf',
          education_level: 'undergraduate',
          subject_area: 'Business Administration',
          keywords: ['Sustainability', 'Business', 'Philippines', 'Environment'],
          author: 'Juan dela Cruz',
          year: 2023,
          library: currentLibrary,
          uploaded_by: 'Library Staff',
          upload_date: new Date('2023-11-15'),
          download_count: 32,
          status: 'active'
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument.title || !newDocument.file_url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const document: EnhancedDocument = {
        id: Date.now().toString(),
        ...newDocument,
        library: currentLibrary,
        upload_date: new Date(),
        download_count: 0,
        status: 'active'
      };

      setDocuments(prev => [document, ...prev]);
      setIsAddDialogOpen(false);
      setNewDocument({
        title: '',
        description: '',
        file_url: '',
        file_type: 'pdf',
        education_level: 'undergraduate',
        subject_area: '',
        keywords: [],
        author: '',
        year: new Date().getFullYear(),
        uploaded_by: 'Library Staff'
      });

      toast({
        title: "Success",
        description: "Document added successfully",
      });
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        title: "Error",
        description: "Failed to add document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = (keyword: string) => {
    if (keyword.trim() && !newDocument.keywords.includes(keyword.trim())) {
      setNewDocument(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }));
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setNewDocument(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = selectedLevel === 'all' || doc.education_level === selectedLevel;
    const matchesSubject = selectedSubject === 'all' || doc.subject_area === selectedSubject;
    const matchesYear = selectedYear === 'all' || doc.year.toString() === selectedYear;
    
    return matchesSearch && matchesLevel && matchesSubject && matchesYear;
  });

  const uniqueYears = [...new Set(documents.map(doc => doc.year))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Research Documents</h2>
          <p className="text-muted-foreground">
            Digital archive of thesis and research papers
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Research Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Document Title *</Label>
                  <Input
                    id="title"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter document title"
                  />
                </div>
                <div>
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={newDocument.author}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDocument.description}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the document"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="file_url">File URL *</Label>
                  <Input
                    id="file_url"
                    value={newDocument.file_url}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, file_url: e.target.value }))}
                    placeholder="https://example.com/document.pdf"
                  />
                </div>
                <div>
                  <Label htmlFor="file_type">File Type</Label>
                  <Select
                    value={newDocument.file_type}
                    onValueChange={(value) => setNewDocument(prev => ({ ...prev, file_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fileTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="education_level">Education Level</Label>
                  <Select
                    value={newDocument.education_level}
                    onValueChange={(value: 'undergraduate' | 'graduate' | 'postgraduate') => 
                      setNewDocument(prev => ({ ...prev, education_level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject_area">Subject Area</Label>
                  <Select
                    value={newDocument.subject_area}
                    onValueChange={(value) => setNewDocument(prev => ({ ...prev, subject_area: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectAreas.map(subject => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newDocument.year}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div>
                <Label>Keywords</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newDocument.keywords.map(keyword => (
                    <Badge key={keyword} variant="secondary" className="cursor-pointer"
                           onClick={() => handleRemoveKeyword(keyword)}>
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add keyword and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              <Button onClick={handleAddDocument} disabled={loading} className="w-full">
                {loading ? 'Adding...' : 'Add Document'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search documents, authors, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Education Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="undergraduate">Undergraduate</SelectItem>
                <SelectItem value="graduate">Graduate</SelectItem>
                <SelectItem value="postgraduate">Postgraduate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Subject Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjectAreas.map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="grid gap-4">
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No documents found</p>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'Add your first research document'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{doc.title}</h3>
                    <p className="text-muted-foreground mb-3">{doc.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {doc.education_level}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {doc.subject_area}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {doc.year}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {doc.author}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doc.keywords.map(keyword => (
                        <Badge key={keyword} variant="secondary" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Uploaded: {doc.upload_date.toLocaleDateString()} • Downloads: {doc.download_count}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EnhancedDocumentUpload;