
import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';
import { format, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
import ExportControls from './ExportControls';
import ImportControls from './ImportControls';
import DataOverview from './DataOverview';
import { convertToCSV, convertToSVD, createJSONExport } from '@/utils/exportUtils';

interface AdminDataManagementProps {
  students: Student[];
  attendanceRecords: AttendanceEntry[];
  onDataImported: (students: Student[], records: AttendanceEntry[]) => void;
}

const AdminDataManagement = ({ students, attendanceRecords, onDataImported }: AdminDataManagementProps) => {
  const [exportDateRange, setExportDateRange] = useState('today');
  const [exportDepartment, setExportDepartment] = useState('All Departments');
  const [exportFormat, setExportFormat] = useState('json');

  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;

    switch (exportDateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
      default:
        startDate = new Date(0);
    }

    const filteredRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      const isInDateRange = isAfter(recordDate, startDate) || recordDate.toDateString() === startDate.toDateString();
      
      if (!isInDateRange) return false;

      if (exportDepartment === 'All Departments') return true;

      // Find the student and check their department
      const student = students.find(s => s.studentId === record.studentId);
      return student?.department === exportDepartment;
    });

    const filteredStudents = exportDepartment === 'All Departments' 
      ? students 
      : students.filter(s => s.department === exportDepartment);

    return { filteredStudents, filteredRecords };
  };

  const handleExportData = () => {
    const { filteredStudents, filteredRecords } = getFilteredData();

    let content: string;
    let mimeType: string;
    let fileExtension: string;

    if (exportFormat === 'csv') {
      content = convertToCSV(filteredStudents, filteredRecords);
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else if (exportFormat === 'svd') {
      content = convertToSVD(filteredStudents, filteredRecords, exportDateRange, exportDepartment);
      mimeType = 'text/plain';
      fileExtension = 'svd';
    } else {
      // Default JSON format
      const exportData = createJSONExport(filteredStudents, filteredRecords, exportDateRange, exportDepartment);
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library-data-${exportDateRange}-${exportDepartment.toLowerCase().replace(' ', '-')}-${format(new Date(), 'yyyy-MM-dd')}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: `Exported ${filteredRecords.length} records and ${filteredStudents.length} students as ${exportFormat.toUpperCase()}`,
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.students && data.attendance) {
          onDataImported(data.students, data.attendance);
          toast({
            title: "Data Imported",
            description: `Imported ${data.students.length} students and ${data.attendance.length} records`,
          });
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format or corrupted data",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const { filteredStudents, filteredRecords } = getFilteredData();
  const visitors = filteredRecords.filter(r => r.studentId === 'VISITOR');
  const regularAttendance = filteredRecords.filter(r => r.studentId !== 'VISITOR');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Admin Data Management</h2>
        <p className="text-muted-foreground">Manage and export library data</p>
      </div>

      <ExportControls
        exportDateRange={exportDateRange}
        setExportDateRange={setExportDateRange}
        exportDepartment={exportDepartment}
        setExportDepartment={setExportDepartment}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        onExportData={handleExportData}
        previewCounts={{
          records: filteredRecords.length,
          students: filteredStudents.length
        }}
      />

      <ImportControls onImportData={handleImportData} />

      <DataOverview
        students={filteredStudents}
        regularAttendance={regularAttendance}
        visitors={visitors}
      />
    </div>
  );
};

export default AdminDataManagement;
