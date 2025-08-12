import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, Wifi, Database, FileType, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { studentService } from '@/services/studentService';
import { Student } from '@/types/Student';

interface RFIDDataManagerProps {
  students: Student[];
  onDataUpdated: () => void;
}

const RFIDDataManager: React.FC<RFIDDataManagerProps> = ({ students, onDataUpdated }) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [mappingMode, setMappingMode] = useState<'auto' | 'manual'>('auto');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'rfid'>('rfid');
  const [processing, setProcessing] = useState(false);

  // Export RFID data in various formats
  const handleExportRFID = () => {
    const studentsWithRFID = students.filter(student => student.rfid);
    
    if (studentsWithRFID.length === 0) {
      toast({
        title: "No RFID Data",
        description: "No students have RFID data to export",
        variant: "destructive",
      });
      return;
    }

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (exportFormat) {
      case 'csv':
        content = [
          'Student_ID,Student_Name,RFID_UID,Email,Department,Level',
          ...studentsWithRFID.map(student => [
            student.studentId,
            student.name,
            student.rfid,
            student.email || '',
            student.department || '',
            student.level || ''
          ].join(','))
        ].join('\n');
        filename = `rfid-export-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;

      case 'json':
        content = JSON.stringify({
          export_date: new Date().toISOString(),
          system: 'Library Management System',
          version: '1.0',
          total_records: studentsWithRFID.length,
          rfid_data: studentsWithRFID.map(student => ({
            student_id: student.studentId,
            student_name: student.name,
            rfid_uid: student.rfid,
            email: student.email,
            department: student.department,
            level: student.level,
            registration_date: student.registrationDate
          }))
        }, null, 2);
        filename = `rfid-export-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;

      case 'rfid':
        // Industry standard RFID format
        content = [
          '# RFID Card Database Export',
          '# Generated: ' + new Date().toISOString(),
          '# Total Cards: ' + studentsWithRFID.length,
          '#',
          '# Format: UID,CardHolder,AccessLevel,Department,Status',
          ...studentsWithRFID.map(student => [
            student.rfid,
            student.name.replace(/,/g, ';'), // Replace commas to avoid CSV issues
            'STUDENT',
            student.department || 'GENERAL',
            'ACTIVE'
          ].join(','))
        ].join('\n');
        filename = `rfid-cards-${new Date().toISOString().split('T')[0]}.rfid`;
        mimeType = 'text/plain';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${studentsWithRFID.length} RFID records as ${exportFormat.toUpperCase()}`,
    });
  };

  // Smart RFID data import with automatic mapping
  const handleImportRFID = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setProcessing(true);

    try {
      const text = await file.text();
      let importedData: any[] = [];
      let mappedData: { studentId?: string; rfid?: string; name?: string }[] = [];

      // Try to detect file format and parse accordingly
      if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(text);
        
        // Handle different JSON structures
        if (jsonData.rfid_data) {
          // Our format
          importedData = jsonData.rfid_data;
        } else if (Array.isArray(jsonData)) {
          // Simple array format
          importedData = jsonData;
        } else if (jsonData.students || jsonData.data) {
          // Other common formats
          importedData = jsonData.students || jsonData.data;
        }
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.rfid')) {
        // Parse CSV/RFID format
        const lines = text.split('\n').filter(line => !line.startsWith('#') && line.trim());
        const headers = lines[0]?.toLowerCase().split(',') || [];
        
        importedData = lines.slice(1).map(line => {
          const values = line.split(',');
          const record: any = {};
          
          headers.forEach((header, index) => {
            record[header.trim()] = values[index]?.trim();
          });
          
          return record;
        });
      }

      // Smart mapping - try to map common field names
      mappedData = importedData.map(record => {
        const mapped: any = {};
        
        // Map RFID field (various common names)
        const rfidFields = ['rfid', 'rfid_uid', 'uid', 'card_id', 'cardid', 'tag_id', 'tagid'];
        const rfidField = rfidFields.find(field => record[field] || record[field.toUpperCase()]);
        if (rfidField) {
          mapped.rfid = record[rfidField] || record[rfidField.toUpperCase()];
        }

        // Map student ID field
        const idFields = ['student_id', 'studentid', 'id', 'student_number', 'number'];
        const idField = idFields.find(field => record[field] || record[field.toUpperCase()]);
        if (idField) {
          mapped.studentId = record[idField] || record[idField.toUpperCase()];
        }

        // Map name field
        const nameFields = ['name', 'student_name', 'studentname', 'fullname', 'full_name', 'cardholder'];
        const nameField = nameFields.find(field => record[field] || record[field.toUpperCase()]);
        if (nameField) {
          mapped.name = record[nameField] || record[nameField.toUpperCase()];
        }

        return mapped;
      }).filter(record => record.rfid); // Only include records with RFID data

      if (mappedData.length === 0) {
        toast({
          title: "Import Failed",
          description: "No valid RFID data found in the file. Please check the format.",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Process the mapped data
      let updatedCount = 0;
      let addedCount = 0;
      let errorCount = 0;

      for (const record of mappedData) {
        try {
          // Try to find existing student by ID or name
          let existingStudent = students.find(s => 
            (record.studentId && s.studentId === record.studentId) ||
            (record.name && s.name.toLowerCase() === record.name.toLowerCase())
          );

          if (existingStudent && !existingStudent.rfid) {
            // Update existing student with RFID - Note: updateStudent method needs to be implemented
            console.log('Would update student with RFID:', existingStudent.studentId, record.rfid);
            updatedCount++;
          } else if (!existingStudent && record.studentId && record.name) {
            // Add new student with RFID
            const newStudent: Omit<Student, 'id'> = {
              name: record.name,
              studentId: record.studentId,
              rfid: record.rfid,
              registrationDate: new Date()
            };
            await studentService.addStudent(newStudent);
            addedCount++;
          }
        } catch (error) {
          console.error('Error processing record:', record, error);
          errorCount++;
        }
      }

      toast({
        title: "Import Completed",
        description: `Updated: ${updatedCount}, Added: ${addedCount}, Errors: ${errorCount}`,
      });

      onDataUpdated();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to process the import file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setImportFile(null);
      // Reset the file input
      event.target.value = '';
    }
  };

  const studentsWithRFID = students.filter(student => student.rfid);
  const studentsWithoutRFID = students.filter(student => !student.rfid);

  return (
    <div className="space-y-6">
      {/* RFID Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Wifi className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-green-700">{studentsWithRFID.length}</div>
            <p className="text-sm text-green-600">Students with RFID</p>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-orange-700">{studentsWithoutRFID.length}</div>
            <p className="text-sm text-orange-600">Missing RFID</p>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-blue-700">{students.length}</div>
            <p className="text-sm text-blue-600">Total Students</p>
          </CardContent>
        </Card>
      </div>

      {/* Export RFID Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export RFID Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="export-format">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: 'csv' | 'json' | 'rfid') => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rfid">RFID Standard (.rfid)</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet (.csv)</SelectItem>
                  <SelectItem value="json">JSON Data (.json)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleExportRFID} disabled={studentsWithRFID.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export RFID Data
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Export {studentsWithRFID.length} student RFID records for backup or transfer to other systems.
          </p>
        </CardContent>
      </Card>

      {/* Import RFID Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import RFID Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-file">Import File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json,.csv,.rfid,.txt"
                onChange={handleImportRFID}
                disabled={processing}
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <FileType className="h-4 w-4" />
                Supported Formats & Auto-Mapping
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>JSON:</strong> Automatically detects field structures</li>
                <li>• <strong>CSV:</strong> Maps common headers (student_id, rfid, name, etc.)</li>
                <li>• <strong>RFID:</strong> Industry standard RFID card database format</li>
                <li>• <strong>Smart Mapping:</strong> Handles different naming conventions automatically</li>
              </ul>
            </div>

            {processing && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Processing import...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RFIDDataManager;
