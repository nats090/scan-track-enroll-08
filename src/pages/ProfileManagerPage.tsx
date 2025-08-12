
import React from 'react';
import ProfileManager from '@/components/ProfileManager';
import { Student } from '@/types/Student';

interface ProfileManagerPageProps {
  students: Student[];
  onUpdateStudent: (student: Student) => void;
}

const ProfileManagerPage = ({ students, onUpdateStudent }: ProfileManagerPageProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Profile Manager</h2>
        <p className="text-muted-foreground text-lg">
          Edit and manage student profiles
        </p>
      </div>
      <ProfileManager
        students={students}
        onUpdateStudent={onUpdateStudent}
      />
    </div>
  );
};

export default ProfileManagerPage;
