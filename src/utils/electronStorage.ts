export interface OfflineData {
  students: any[];
  attendanceRecords: any[];
  lastSync: string | null;
}

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

export const saveToFileSystem = async (data: Partial<OfflineData>) => {
  if (!isElectron()) {
    throw new Error('Not running in Electron environment');
  }

  try {
    const existing = await getFromFileSystem();
    const updated = { ...existing, ...data };
    
    // Serialize data properly for file storage
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
    
    const result = await window.electronAPI.saveData(serializedData);
    if (result.success) {
      console.log('Data saved to file system');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to save to file system:', error);
    throw error;
  }
};

export const getFromFileSystem = async (): Promise<OfflineData> => {
  if (!isElectron()) {
    throw new Error('Not running in Electron environment');
  }

  try {
    const result = await window.electronAPI.loadData();
    if (result.success) {
      const parsed = result.data;
      
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
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to load from file system:', error);
    return {
      students: [],
      attendanceRecords: [],
      lastSync: null
    };
  }
};

export const clearFileSystem = async () => {
  if (!isElectron()) {
    throw new Error('Not running in Electron environment');
  }

  try {
    const result = await window.electronAPI.clearData();
    if (result.success) {
      console.log('File system storage cleared');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to clear file system:', error);
    throw error;
  }
};