
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';

export const convertToCSV = (filteredStudents: Student[], filteredRecords: AttendanceEntry[]) => {
  // Create CSV for students
  const studentHeaders = ['ID', 'Name', 'Student ID', 'Email', 'Department', 'Level', 'Shift'];
  const studentRows = filteredStudents.map((student: Student) => [
    student.id,
    student.name,
    student.studentId,
    student.email || '',
    student.department || '',
    student.level || '',
    student.shift || ''
  ]);
  
  // Create CSV for attendance
  const attendanceHeaders = ['ID', 'Student Name', 'Student ID', 'Timestamp', 'Method', 'Purpose', 'Contact'];
  const attendanceRows = filteredRecords.map((record: AttendanceEntry) => [
    record.id,
    record.studentName,
    record.studentId,
    new Date(record.timestamp).toISOString(),
    record.method,
    record.purpose || '',
    record.contact || ''
  ]);

  const studentCSV = [studentHeaders, ...studentRows].map(row => row.join(',')).join('\n');
  const attendanceCSV = [attendanceHeaders, ...attendanceRows].map(row => row.join(',')).join('\n');
  
  return `STUDENTS\n${studentCSV}\n\nATTENDANCE\n${attendanceCSV}`;
};

export const convertToSVD = (filteredStudents: Student[], filteredRecords: AttendanceEntry[], exportDateRange: string, exportDepartment: string) => {
  // SVD format: Simple delimited format with pipe separators
  let svdContent = 'LIBRARY_DATA_SVD|1.0\n';
  svdContent += `EXPORT_INFO|${exportDateRange}|${exportDepartment}|${new Date().toISOString()}\n`;
  svdContent += `COUNTS|${filteredStudents.length}|${filteredRecords.length}\n\n`;
  
  svdContent += 'STUDENTS_START\n';
  filteredStudents.forEach((student: Student) => {
    svdContent += `STU|${student.id}|${student.name}|${student.studentId}|${student.email || ''}|${student.department || ''}|${student.level || ''}|${student.shift || ''}\n`;
  });
  svdContent += 'STUDENTS_END\n\n';
  
  svdContent += 'ATTENDANCE_START\n';
  filteredRecords.forEach((record: AttendanceEntry) => {
    svdContent += `ATT|${record.id}|${record.studentName}|${record.studentId}|${new Date(record.timestamp).toISOString()}|${record.method}|${record.purpose || ''}|${record.contact || ''}\n`;
  });
  svdContent += 'ATTENDANCE_END\n';
  
  return svdContent;
};

export const createJSONExport = (filteredStudents: Student[], filteredRecords: AttendanceEntry[], exportDateRange: string, exportDepartment: string) => {
  return {
    students: filteredStudents,
    attendance: filteredRecords,
    visitors: filteredRecords.filter(r => r.studentId === 'VISITOR'),
    exportInfo: {
      dateRange: exportDateRange,
      department: exportDepartment,
      exportedAt: new Date().toISOString(),
      totalStudents: filteredStudents.length,
      totalAttendance: filteredRecords.length,
    }
  };
};
