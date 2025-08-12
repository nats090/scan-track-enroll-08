import { supabase } from '@/integrations/supabase/client';
import { getFromLocalStorage, saveToLocalStorage } from '@/utils/offlineStorage';
import { studentService } from './studentService';
import { attendanceService } from './attendanceService';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';

class AutoSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline = navigator.onLine;

  constructor() {
    this.setupOnlineListener();
    this.startAutoSync();
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('Connection restored - starting sync');
      this.isOnline = true;
      this.performSync();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost - offline mode');
      this.isOnline = false;
    });
  }

  private startAutoSync() {
    // Sync every 10 seconds when online for better real-time experience
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.performSync();
      }
    }, 10000);
  }

  private async performSync() {
    try {
      await this.syncLocalToSupabase();
      await this.syncSupabaseToLocal();
      console.log('Auto-sync completed successfully');
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }

  private async syncLocalToSupabase() {
    const localData = await getFromLocalStorage();
    let syncCount = 0;

    // Sync students with local_ prefix (offline-created items)
    const localStudents = localData.students.filter(s => s.id.toString().startsWith('local_'));
    for (const student of localStudents) {
      try {
        const { data, error } = await supabase
          .from('students')
          .insert({
            name: student.name,
            student_id: student.studentId,
            course: student.course,
            year: student.year,
            library: student.library,
            qr_code: student.qrCode,
            email: student.email,
            biometric_data: student.biometricData,
            rfid: student.rfid
          })
          .select()
          .single();

        if (!error && data) {
          // Replace local student with server version
          const updatedStudents = localData.students.map(s =>
            s.id === student.id ? {
              id: data.id,
              name: data.name,
              studentId: data.student_id,
              email: data.email,
              course: data.course,
              year: data.year,
              library: data.library,
              qrCode: data.qr_code,
              biometricData: data.biometric_data,
              rfid: data.rfid
            } : s
          );
          localData.students = updatedStudents;
          syncCount++;
          console.log(`Synced student: ${student.name}`);
        }
      } catch (error) {
        console.error('Failed to sync student:', error);
      }
    }

    // Sync attendance records with local_ prefix
    const localRecords = localData.attendanceRecords.filter(r => r.id.toString().startsWith('local_'));
    for (const record of localRecords) {
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .insert({
            student_id: record.studentId,
            student_name: record.studentName,
            timestamp: record.timestamp instanceof Date ? record.timestamp.toISOString() : record.timestamp,
            type: record.type || 'check-in',
            barcode: record.barcode,
            method: record.method,
            purpose: record.purpose,
            contact: record.contact,
            library: record.library
          })
          .select()
          .single();

        if (!error && data) {
          // Replace local record with server version
          const updatedRecords = localData.attendanceRecords.map(r =>
            r.id === record.id ? {
              id: data.id,
              studentId: data.student_id,
              studentName: data.student_name,
              timestamp: new Date(data.timestamp),
              type: data.type,
              barcode: data.barcode,
              method: data.method,
              purpose: data.purpose,
              contact: data.contact,
              library: data.library
            } : r
          );
          localData.attendanceRecords = updatedRecords;
          syncCount++;
          console.log(`Synced attendance record for: ${record.studentName}`);
        }
      } catch (error) {
        console.error('Failed to sync attendance record:', error);
      }
    }
    // Sync updates to existing students that were edited offline (_dirty flag)
    const dirtyStudents = (localData.students || []).filter((s: any) => !s.id?.toString().startsWith('local_') && (s as any)._dirty);
    for (const s of dirtyStudents) {
      try {
        const { data, error } = await supabase
          .from('students')
          .update({
            name: s.name,
            student_id: s.studentId,
            email: s.email,
            course: s.department,
            biometric_data: s.biometricData,
            rfid: s.rfid,
            library: s.library
          })
          .eq('id', s.id)
          .select()
          .single();

        if (!error && data) {
          localData.students = localData.students.map((it: any) =>
            it.id === s.id
              ? {
                  id: data.id,
                  name: data.name,
                  studentId: data.student_id,
                  email: data.email || '',
                  department: data.course,
                  biometricData: data.biometric_data || '',
                  rfid: data.rfid || '',
                  library: (data as any).library as 'notre-dame' | 'ibed' || 'notre-dame'
                }
              : it
          );
          syncCount++;
          console.log(`Synced edits for student: ${s.name}`);
        }
      } catch (error) {
        console.error('Failed to sync edited student:', error);
      }
    }

    if (syncCount > 0) {
      saveToLocalStorage({
        students: localData.students,
        attendanceRecords: localData.attendanceRecords,
        lastSync: new Date().toISOString()
      });
      console.log(`Auto-sync completed: ${syncCount} items uploaded to server`);
    }
  }

  private async syncSupabaseToLocal() {
    try {
      // Get fresh data from server
        const [studentsResponse, attendanceResponse] = await Promise.all([
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('attendance_records').select('*').order('timestamp', { ascending: false })
      ]);

      if (!studentsResponse.error && !attendanceResponse.error) {
        const students = studentsResponse.data?.map((s: any) => ({
          id: s.id,
          name: s.name,
          studentId: s.student_id,
          email: s.email || '',
          department: s.course,
          biometricData: s.biometric_data || '',
          rfid: s.rfid || '',
          library: (s as any).library as 'notre-dame' | 'ibed' || 'notre-dame'
        })) || [];

        const attendanceRecords = attendanceResponse.data?.map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          studentName: r.student_name,
          timestamp: new Date(r.timestamp),
          type: (r as any).type || 'check-in',
          barcode: r.barcode,
          method: r.method as 'barcode' | 'biometric' | 'manual',
          purpose: r.purpose,
          contact: r.contact,
          library: (r as any).library as 'notre-dame' | 'ibed' || 'notre-dame'
        })) || [];

        // Merge with local data (keep local-only items and preserve local edits until uploaded)
        const localData = await getFromLocalStorage();
        const localOnlyStudents = (localData.students || []).filter((s: any) => s.id?.toString().startsWith('local_'));
        const localOnlyRecords = (localData.attendanceRecords || []).filter((r: any) => r.id?.toString().startsWith('local_'));
        const dirtyStudents = (localData.students || []).filter((s: any) => !s.id?.toString().startsWith('local_') && (s as any)._dirty);
        const dirtyMap = Object.fromEntries(dirtyStudents.map((s: any) => [s.id, s]));

        const overlayedStudents = students.map(s => dirtyMap[s.id] ? { ...s, ...(dirtyMap[s.id] as any) } : s);

        saveToLocalStorage({
          students: [...overlayedStudents, ...localOnlyStudents],
          attendanceRecords: [...attendanceRecords, ...localOnlyRecords],
          lastSync: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to sync from server:', error);
    }
  }

  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const autoSyncService = new AutoSyncService();
