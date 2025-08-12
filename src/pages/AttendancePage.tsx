import React from 'react';
import AttendanceRecord from '@/components/AttendanceRecord';
import { AttendanceEntry } from '@/types/AttendanceEntry';

interface AttendancePageProps {
  records: AttendanceEntry[];
}

const AttendancePage = ({ records }: AttendancePageProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Attendance Records</h2>
        <p className="text-muted-foreground text-lg">
          View and manage attendance history
        </p>
      </div>
      <AttendanceRecord records={records} />
    </div>
  );
};

export default AttendancePage;
