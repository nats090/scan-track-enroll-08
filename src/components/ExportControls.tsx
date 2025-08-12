
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';

interface ExportControlsProps {
  exportDateRange: string;
  setExportDateRange: (value: string) => void;
  exportDepartment: string;
  setExportDepartment: (value: string) => void;
  exportFormat: string;
  setExportFormat: (value: string) => void;
  onExportData: () => void;
  previewCounts: {
    records: number;
    students: number;
  };
}

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

const DEPARTMENTS = [
  { value: 'All Departments', label: 'All Departments' }, 
  { value: 'CECE', label: 'CECE' }, 
  { value: 'CBA', label: 'CBA' }, 
  { value: 'CTELAN', label: 'CTELAN' }
];

const EXPORT_FORMATS = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'svd', label: 'SVD' },
];

const ExportControls = ({
  exportDateRange,
  setExportDateRange,
  exportDepartment,
  setExportDepartment,
  exportFormat,
  setExportFormat,
  onExportData,
  previewCounts
}: ExportControlsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select value={exportDateRange} onValueChange={setExportDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Department Filter</label>
            <Select value={exportDepartment} onValueChange={setExportDepartment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map(department => (
                  <SelectItem key={department.value} value={department.value}>
                    {department.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={onExportData} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Will export: {previewCounts.records} records, {previewCounts.students} students as {exportFormat.toUpperCase()}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportControls;
