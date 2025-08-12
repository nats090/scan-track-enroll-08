
import React from 'react';
import StudentList from '@/components/StudentList';
import { Student } from '@/types/Student';

interface StudentsPageProps {
  students: Student[];
}

const StudentsPage = ({ students }: StudentsPageProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Student Directory</h2>
        <p className="text-muted-foreground text-lg">
          View all registered students and their status
        </p>
      </div>
      <StudentList students={students} />
    </div>
  );
};

export default StudentsPage;
