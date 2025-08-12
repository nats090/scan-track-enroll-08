
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentUploadForm from '@/components/DocumentUploadForm';
import DocumentViewer from '@/components/DocumentViewer';
import { Upload, Eye } from 'lucide-react';

const ThesisResearchPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDocumentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Past Thesis & Research Documents</h2>
        <p className="text-muted-foreground text-lg">
          Upload and manage thesis and research document links
        </p>
      </div>
      
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-lg p-1">
          <TabsTrigger 
            value="upload" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Upload className="h-4 w-4" />
            Upload Documents
          </TabsTrigger>
          <TabsTrigger 
            value="view" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Eye className="h-4 w-4" />
            View Documents
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <DocumentUploadForm onDocumentAdded={handleDocumentAdded} />
        </TabsContent>
        
        <TabsContent value="view" className="space-y-4">
          <DocumentViewer refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ThesisResearchPage;
