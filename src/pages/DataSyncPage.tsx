import React from 'react';
import SyncControls from '@/components/SyncControls';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';

interface DataSyncPageProps {
  onDataSynced: (students: Student[], attendanceRecords: AttendanceEntry[]) => void;
}

const DataSyncPage = ({ onDataSynced }: DataSyncPageProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Data Synchronization</h2>
        <p className="text-muted-foreground text-lg">
          Manage data synchronization between local storage and Supabase
        </p>
      </div>
      <SyncControls onDataSynced={onDataSynced} />
    </div>
  );
};

export default DataSyncPage;
