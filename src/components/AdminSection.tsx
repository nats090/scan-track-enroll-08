
import React, { useState } from 'react';
import AdminPasskey from './AdminPasskey';
import AdminDataManagement from './AdminDataManagement';
import ProfileManager from './ProfileManager';
import DocumentUpload from './DocumentUpload';
import ThemeCustomizer from './ThemeCustomizer';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, UserCog, FileText, Palette } from 'lucide-react';

interface AdminSectionProps {
  students: Student[];
  attendanceRecords: AttendanceEntry[];
  onDataImported: (students: Student[], records: AttendanceEntry[]) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
}

const AdminSection = ({ students, attendanceRecords, onDataImported, onUpdateStudent, onDeleteStudent }: AdminSectionProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AdminPasskey onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ThemeCustomizer />
      </div>
      
      <Tabs defaultValue="data-management" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data-management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Data Management
          </TabsTrigger>
          <TabsTrigger value="profile-manager" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Profile Manager
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="data-management" className="mt-6">
          <AdminDataManagement 
            students={students}
            attendanceRecords={attendanceRecords}
            onDataImported={onDataImported}
          />
        </TabsContent>
        
        <TabsContent value="profile-manager" className="mt-6">
          <ProfileManager
            students={students}
            onUpdateStudent={onUpdateStudent}
            onDeleteStudent={onDeleteStudent}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSection;
