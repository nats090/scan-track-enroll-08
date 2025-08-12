
import React from 'react';
import AdminSection from '@/components/AdminSection';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';

interface AdminPageProps {
  students: Student[];
  attendanceRecords: AttendanceEntry[];
  onDataImported: (students: Student[], records: AttendanceEntry[]) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
}

const AdminPage = ({ students, attendanceRecords, onDataImported, onUpdateStudent, onDeleteStudent }: AdminPageProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Administration</h2>
        <p className="text-muted-foreground text-lg">
          Administrative functions and data management
        </p>
      </div>
      <AdminSection 
        students={students}
        attendanceRecords={attendanceRecords}
        onDataImported={onDataImported}
        onUpdateStudent={onUpdateStudent}
        onDeleteStudent={onDeleteStudent}
      />
    </div>
  );
};

export default AdminPage;
