
import { studentService } from './studentService';
import { attendanceService } from './attendanceService';
import { documentService } from './documentService';
import { syncService } from './syncService';

// Re-export all services for backward compatibility
export const supabaseService = {
  // Student operations
  ...studentService,
  
  // Attendance operations
  ...attendanceService,
  
  // Document operations
  ...documentService,
  
  // Sync operations
  ...syncService
};

// Export types for backward compatibility
export type { DatabaseStudent } from './studentService';
export type { DatabaseAttendanceRecord } from './attendanceService';
export type { DocumentLink } from './documentService';
