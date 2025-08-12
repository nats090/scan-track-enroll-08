
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface ImportControlsProps {
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImportControls = ({ onImportData }: ImportControlsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Data Import
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            accept=".json"
            onChange={onImportData}
            className="hidden"
            id="import-file"
          />
          <Button asChild variant="outline">
            <label htmlFor="import-file" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import Data (JSON)
            </label>
          </Button>
          <p className="text-sm text-muted-foreground">
            Import previously exported data files to restore or merge data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportControls;
