
export interface AttendanceEntry {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
  type: 'check-in' | 'check-out'; // Separate check-in and check-out records
  barcode?: string;
  method: 'barcode' | 'biometric' | 'manual' | 'rfid';
  purpose?: string;
  contact?: string;
  library?: 'notre-dame' | 'ibed'; // Multi-library support
}
