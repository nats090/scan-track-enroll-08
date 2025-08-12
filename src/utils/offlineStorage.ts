
import { saveToFileSystem, getFromFileSystem, clearFileSystem } from './electronStorage';

export interface OfflineData {
  students: any[];
  attendanceRecords: any[];
  lastSync: string | null;
}

const STORAGE_KEY = 'library-attendance-offline';

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

export const saveToLocalStorage = async (data: Partial<OfflineData>) => {
  // Use file system storage if in Electron, otherwise fallback to localStorage
  if (isElectron()) {
    try {
      await saveToFileSystem(data);
      return;
    } catch (error) {
      console.warn('Failed to save to file system, falling back to localStorage:', error);
    }
  }

  // Fallback to browser localStorage
  try {
    const existing = await getFromLocalStorage();
    const updated = { ...existing, ...data };
    
    // Serialize data properly for localStorage
    const serializedData = {
      ...updated,
      attendanceRecords: updated.attendanceRecords?.map(record => ({
        ...record,
        timestamp: record.timestamp instanceof Date ? record.timestamp.toISOString() : record.timestamp
      })) || existing.attendanceRecords,
      students: updated.students?.map(student => ({
        ...student,
        lastScan: student.lastScan instanceof Date ? student.lastScan.toISOString() : student.lastScan,
        registrationDate: student.registrationDate instanceof Date ? student.registrationDate.toISOString() : student.registrationDate
      })) || existing.students
    };
    
    // Only save if data has actually changed to prevent excessive logging
    const existingString = localStorage.getItem(STORAGE_KEY);
    const newString = JSON.stringify(serializedData);
    
    if (existingString !== newString) {
      localStorage.setItem(STORAGE_KEY, newString);
      console.log('Data saved to browser localStorage');
    }
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const getFromLocalStorage = async (): Promise<OfflineData> => {
  // Use file system storage if in Electron, otherwise fallback to localStorage
  if (isElectron()) {
    try {
      return await getFromFileSystem();
    } catch (error) {
      console.warn('Failed to load from file system, falling back to localStorage:', error);
    }
  }

  // Fallback to browser localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Deserialize Date objects properly
      return {
        ...parsed,
        attendanceRecords: parsed.attendanceRecords?.map((record: any) => ({
          ...record,
          timestamp: typeof record.timestamp === 'string' ? new Date(record.timestamp) : record.timestamp
        })) || [],
        students: parsed.students?.map((student: any) => ({
          ...student,
          lastScan: typeof student.lastScan === 'string' ? new Date(student.lastScan) : student.lastScan,
          registrationDate: typeof student.registrationDate === 'string' ? new Date(student.registrationDate) : student.registrationDate
        })) || []
      };
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  
  return {
    students: [],
    attendanceRecords: [],
    lastSync: null
  };
};

export const clearLocalStorage = async () => {
  // Clear file system storage if in Electron, otherwise fallback to localStorage
  if (isElectron()) {
    try {
      await clearFileSystem();
      return;
    } catch (error) {
      console.warn('Failed to clear file system, falling back to localStorage:', error);
    }
  }

  // Fallback to browser localStorage
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Browser localStorage cleared');
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

export const isOnline = () => {
  return navigator.onLine;
};
