import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, BookOpen } from 'lucide-react';
import { useLibrary } from '@/contexts/LibraryContext';

const LibrarySelector = () => {
  const { currentLibrary, setCurrentLibrary, libraries } = useLibrary();

  const getCurrentLibraryInfo = () => {
    return libraries.find(lib => lib.id === currentLibrary);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Library:</span>
      </div>
      
      <Select value={currentLibrary} onValueChange={setCurrentLibrary}>
        <SelectTrigger className="w-48 bg-background/50 backdrop-blur-sm border-border/50">
          <SelectValue placeholder="Select library" />
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-md border-border/50">
          {libraries.map((library) => (
            <SelectItem key={library.id} value={library.id}>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">{library.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Badge variant="secondary" className="hidden sm:flex">
        {getCurrentLibraryInfo()?.fullName}
      </Badge>
    </div>
  );
};

export default LibrarySelector;