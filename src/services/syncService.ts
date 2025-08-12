
import { saveToLocalStorage, getFromLocalStorage } from '@/utils/offlineStorage';
import { studentService } from './studentService';
import { attendanceService } from './attendanceService';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';

export const syncService = {
  async syncLocalToSupabase(): Promise<{ studentsAdded: number; recordsAdded: number }> {
    const localData = await getFromLocalStorage();
    let studentsAdded = 0;
    let recordsAdded = 0;

    console.log('Starting sync from local storage to Supabase...');

    // Sync students
    for (const student of localData.students) {
      try {
        const existingStudent = await studentService.findStudentByBarcode(student.studentId);
        if (!existingStudent) {
          await studentService.addStudent(student);
          studentsAdded++;
          console.log(`Synced student: ${student.name}`);
        }
      } catch (error) {
        console.error(`Failed to sync student ${student.name}:`, error);
      }
    }

    // Sync attendance records
    for (const record of localData.attendanceRecords) {
      try {
        const timestamp = typeof record.timestamp === 'string' ? new Date(record.timestamp) : record.timestamp;
        
        await attendanceService.addAttendanceRecord({
          ...record,
          timestamp
        });
        recordsAdded++;
        console.log(`Synced attendance record for: ${record.studentName}`);
      } catch (error) {
        console.error(`Failed to sync attendance record for ${record.studentName}:`, error);
      }
    }

    saveToLocalStorage({ lastSync: new Date().toISOString() });

    console.log(`Sync completed: ${studentsAdded} students, ${recordsAdded} records added`);
    return { studentsAdded, recordsAdded };
  },

  async syncSupabaseToLocal(): Promise<{ students: Student[]; attendanceRecords: AttendanceEntry[] }> {
    console.log('Starting sync from Supabase to local storage...');

    const [studentsData, attendanceData] = await Promise.all([
      studentService.getStudents(),
      attendanceService.getAttendanceRecords()
    ]);

    const studentsWithLastScan = await Promise.all(
      studentsData.map(async (student) => {
        const lastScan = await attendanceService.getStudentLastScan(student.studentId);
        return { ...student, lastScan };
      })
    );

    saveToLocalStorage({
      students: studentsWithLastScan,
      attendanceRecords: attendanceData,
      lastSync: new Date().toISOString()
    });

    console.log(`Downloaded ${studentsWithLastScan.length} students and ${attendanceData.length} records to local storage`);
    return { students: studentsWithLastScan, attendanceRecords: attendanceData };
  }
};
