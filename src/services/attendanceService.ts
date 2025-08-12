
import { supabase } from '@/integrations/supabase/client';
import { AttendanceEntry } from '@/types/AttendanceEntry';
import { saveToLocalStorage, getFromLocalStorage } from '@/utils/offlineStorage';

export interface DatabaseAttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  timestamp: string;
  type: 'check-in' | 'check-out';
  barcode?: string;
  method: 'barcode' | 'biometric' | 'manual';
  purpose?: string;
  contact?: string;
  created_at: string;
}

// Generate unique ID for offline mode
const generateId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const attendanceService = {
  async getAttendanceRecords(): Promise<AttendanceEntry[]> {
    // Always try local storage first
    const localData = await getFromLocalStorage();
    
    try {
      // Try to fetch from Supabase if online
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!error && data) {
          const records = data.map(record => ({
            id: record.id,
            studentId: record.student_id,
            studentName: record.student_name,
            timestamp: new Date(record.timestamp),
            type: (record as any).type || 'check-in', // Default to check-in for backward compatibility
            barcode: record.barcode,
            method: record.method as 'barcode' | 'biometric' | 'manual',
            purpose: record.purpose,
            contact: record.contact,
            library: (record as any).library as 'notre-dame' | 'ibed' || 'notre-dame'
          }));

          // Preserve any offline-only (local_*) records until they are synced
          const localOnly = (localData.attendanceRecords || []).filter((r: any) => r.id?.toString().startsWith('local_'));
          const merged = [...records, ...localOnly];

          // Update local storage with merged data
          saveToLocalStorage({ attendanceRecords: merged });
          return merged;
        }
      }
    } catch (error) {
      console.log('Using offline data:', error);
    }

    // Return local data as fallback
    return localData.attendanceRecords || [];
  },

  async addAttendanceRecord(record: Omit<AttendanceEntry, 'id'>): Promise<AttendanceEntry> {
    const newRecord: AttendanceEntry = {
      ...record,
      id: generateId()
    };

    // Save to local storage immediately
    const localData = await getFromLocalStorage();
    const updatedRecords = [...localData.attendanceRecords, newRecord];
    saveToLocalStorage({ attendanceRecords: updatedRecords });

    // Try to sync to Supabase if online
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('attendance_records')
          .insert({
            student_id: record.studentId,
            student_name: record.studentName,
            timestamp: record.timestamp.toISOString(),
            type: record.type,
            barcode: record.barcode,
            method: record.method,
            purpose: record.purpose,
            contact: record.contact,
            library: record.library || 'notre-dame'
          })
          .select()
          .single();

        if (!error && data) {
          // Update local record with server ID
          const serverRecord = {
            id: data.id,
            studentId: data.student_id,
            studentName: data.student_name,
            timestamp: new Date(data.timestamp),
            type: (data as any).type || 'check-in', // Default to check-in for backward compatibility
            barcode: data.barcode,
            method: data.method as 'barcode' | 'biometric' | 'manual',
            purpose: data.purpose,
            contact: data.contact,
            library: (data as any).library as 'notre-dame' | 'ibed' || 'notre-dame'
          };
          const updatedWithServerId = updatedRecords.map(r => 
            r.id === newRecord.id ? serverRecord : r
          );
          saveToLocalStorage({ attendanceRecords: updatedWithServerId });
          return serverRecord;
        }
      }
    } catch (error) {
      console.log('Offline mode: Record saved locally');
    }

    return newRecord;
  },

  async getStudentLastScan(studentId: string): Promise<Date | undefined> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('timestamp')
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return undefined;

    return new Date(data.timestamp);
  },

  async getStudentCurrentStatus(studentId: string): Promise<'checked-in' | 'checked-out' | 'unknown'> {
    // First check local storage for recent records
    const localData = await getFromLocalStorage();
    const localRecords = localData.attendanceRecords
      .filter(record => record.studentId === studentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Try to get latest record from Supabase if online
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('type, timestamp')
          .eq('student_id', studentId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return data.type === 'check-in' ? 'checked-in' : 'checked-out';
        }
      }
    } catch (error) {
      console.log('Using local data for status check');
    }

    // Fallback to local data
    if (localRecords.length > 0) {
      const lastRecord = localRecords[0];
      return lastRecord.type === 'check-in' ? 'checked-in' : 'checked-out';
    }

    return 'unknown';
  }
};
