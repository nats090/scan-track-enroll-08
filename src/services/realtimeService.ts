import { supabase } from '@/integrations/supabase/client';
import { saveToLocalStorage, getFromLocalStorage } from '@/utils/offlineStorage';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';

class RealtimeService {
  private studentsChannel: any = null;
  private attendanceChannel: any = null;
  private onDataUpdateCallback: ((students: Student[], records: AttendanceEntry[]) => void) | null = null;

  constructor() {
    this.setupRealtimeListeners();
  }

  private setupRealtimeListeners() {
    // Listen for student changes
    this.studentsChannel = supabase
      .channel('students-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        (payload) => {
          console.log('Student change detected:', payload);
          this.handleStudentChange(payload);
        }
      )
      .subscribe();

    // Listen for attendance changes
    this.attendanceChannel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        (payload) => {
          console.log('Attendance change detected:', payload);
          this.handleAttendanceChange(payload);
        }
      )
      .subscribe();
  }

  private async handleStudentChange(payload: any) {
    const localData = await getFromLocalStorage();
    
    if (payload.eventType === 'INSERT') {
      const newStudent: Student = {
        id: payload.new.id,
        name: payload.new.name,
        studentId: payload.new.student_id,
        email: payload.new.email,
        course: payload.new.course,
        year: payload.new.year,
        library: payload.new.library,
        department: payload.new.course,
        biometricData: payload.new.biometric_data,
        rfid: payload.new.rfid
      };
      
      // Check if student already exists locally
      const existingIndex = localData.students.findIndex(s => s.id === newStudent.id);
      if (existingIndex === -1) {
        localData.students.unshift(newStudent);
        await saveToLocalStorage(localData);
        this.notifyDataUpdate();
      }
    } else if (payload.eventType === 'UPDATE') {
      const updatedStudent: Student = {
        id: payload.new.id,
        name: payload.new.name,
        studentId: payload.new.student_id,
        email: payload.new.email,
        course: payload.new.course,
        year: payload.new.year,
        library: payload.new.library,
        department: payload.new.course,
        biometricData: payload.new.biometric_data,
        rfid: payload.new.rfid
      };
      
      const existingIndex = localData.students.findIndex(s => s.id === updatedStudent.id);
      if (existingIndex !== -1) {
        localData.students[existingIndex] = updatedStudent;
        await saveToLocalStorage(localData);
        this.notifyDataUpdate();
      }
    } else if (payload.eventType === 'DELETE') {
      const deletedId = payload.old.id;
      const existingIndex = localData.students.findIndex(s => s.id === deletedId);
      if (existingIndex !== -1) {
        localData.students.splice(existingIndex, 1);
        await saveToLocalStorage(localData);
        this.notifyDataUpdate();
      }
    }
  }

  private async handleAttendanceChange(payload: any) {
    const localData = await getFromLocalStorage();
    
    if (payload.eventType === 'INSERT') {
      const newRecord: AttendanceEntry = {
        id: payload.new.id,
        studentId: payload.new.student_id,
        studentName: payload.new.student_name,
        timestamp: new Date(payload.new.timestamp),
        type: payload.new.type,
        barcode: payload.new.barcode,
        method: payload.new.method,
        purpose: payload.new.purpose,
        contact: payload.new.contact,
        library: payload.new.library
      };
      
      // Check if record already exists locally
      const existingIndex = localData.attendanceRecords.findIndex(r => r.id === newRecord.id);
      if (existingIndex === -1) {
        localData.attendanceRecords.unshift(newRecord);
        await saveToLocalStorage(localData);
        this.notifyDataUpdate();
      }
    } else if (payload.eventType === 'UPDATE') {
      const updatedRecord: AttendanceEntry = {
        id: payload.new.id,
        studentId: payload.new.student_id,
        studentName: payload.new.student_name,
        timestamp: new Date(payload.new.timestamp),
        type: payload.new.type,
        barcode: payload.new.barcode,
        method: payload.new.method,
        purpose: payload.new.purpose,
        contact: payload.new.contact,
        library: payload.new.library
      };
      
      const existingIndex = localData.attendanceRecords.findIndex(r => r.id === updatedRecord.id);
      if (existingIndex !== -1) {
        localData.attendanceRecords[existingIndex] = updatedRecord;
        await saveToLocalStorage(localData);
        this.notifyDataUpdate();
      }
    } else if (payload.eventType === 'DELETE') {
      const deletedId = payload.old.id;
      const existingIndex = localData.attendanceRecords.findIndex(r => r.id === deletedId);
      if (existingIndex !== -1) {
        localData.attendanceRecords.splice(existingIndex, 1);
        await saveToLocalStorage(localData);
        this.notifyDataUpdate();
      }
    }
  }

  private async notifyDataUpdate() {
    if (this.onDataUpdateCallback) {
      const localData = await getFromLocalStorage();
      this.onDataUpdateCallback(localData.students, localData.attendanceRecords);
    }
  }

  public setOnDataUpdateCallback(callback: (students: Student[], records: AttendanceEntry[]) => void) {
    this.onDataUpdateCallback = callback;
  }

  public destroy() {
    if (this.studentsChannel) {
      supabase.removeChannel(this.studentsChannel);
      this.studentsChannel = null;
    }
    if (this.attendanceChannel) {
      supabase.removeChannel(this.attendanceChannel);
      this.attendanceChannel = null;
    }
  }
}

export const realtimeService = new RealtimeService();