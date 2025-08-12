
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/Student';
import { saveToLocalStorage, getFromLocalStorage } from '@/utils/offlineStorage';

export interface DatabaseStudent {
  id: string;
  name: string;
  student_id: string;
  email?: string;
  course?: string;
  biometric_data?: string;
  rfid?: string;
  created_at: string;
  updated_at: string;
}

// Generate unique ID for offline mode
const generateId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const studentService = {
  async getStudents(): Promise<Student[]> {
    // Always try local storage first
    const localData = await getFromLocalStorage();
    
    try {
      // Try to fetch from Supabase if online
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const students = data.map(student => ({
            id: student.id,
            name: student.name,
            studentId: student.student_id,
            email: student.email || '',
            department: student.course, // backward compatibility
            course: (student as any).course || '',
            year: (student as any).year || '',
            contactNumber: (student as any).contact_number || '',
            biometricData: student.biometric_data || '',
            rfid: student.rfid || '',
            library: (student as any).library as 'notre-dame' | 'ibed' || 'notre-dame',
            lastScan: undefined
          }));

          // Preserve offline-only and locally edited (dirty) students
          const localOnly = (localData.students || []).filter((s: any) => s.id?.toString().startsWith('local_'));
          const dirtyList = (localData.students || []).filter((s: any) => !s.id?.toString().startsWith('local_') && (s as any)._dirty);
          const dirtyMap = Object.fromEntries(dirtyList.map((s: any) => [s.id, s]));
          const overlay = students.map(s => dirtyMap[s.id] ? { ...s, ...(dirtyMap[s.id] as any) } : s);
          const merged = [...overlay, ...localOnly];

          // Update local storage with merged data
          saveToLocalStorage({ students: merged });
          return merged;
        }
      }
    } catch (error) {
      console.log('Using offline data:', error);
    }

    // Return local data as fallback
    return localData.students || [];
  },

  async addStudent(student: Omit<Student, 'id'>): Promise<Student> {
    // For now, we'll store the combined department info in the course field
    let courseInfo = student.department || '';
    if (student.level) {
      courseInfo = student.level + (student.department ? ` - ${student.department}` : '');
      if (student.shift && student.level === 'senior-high') {
        courseInfo += ` (${student.shift} shift)`;
      }
    }

    const newStudent: Student = {
      ...student,
      id: generateId(),
      department: courseInfo
    };

    // Save to local storage immediately
    const localData = await getFromLocalStorage();
    const updatedStudents = [...localData.students, newStudent];
    saveToLocalStorage({ students: updatedStudents });

    // Try to sync to Supabase if online
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('students')
          .insert({
            name: student.name,
            student_id: student.studentId,
            email: student.email,
            course: student.course || courseInfo,
            year: (student as any).year,
            contact_number: (student as any).contactNumber,
            biometric_data: student.biometricData,
            rfid: student.rfid,
            library: student.library || 'notre-dame'
          })
          .select()
          .single();

        if (!error && data) {
          // Update local student with server ID
          const serverStudent = {
            id: data.id,
            name: data.name,
            studentId: data.student_id,
            email: data.email || '',
            department: data.course,
            course: (data as any).course || '',
            year: (data as any).year || '',
            contactNumber: (data as any).contact_number || '',
            biometricData: data.biometric_data || '',
            rfid: data.rfid || '',
            library: data.library as 'notre-dame' | 'ibed' || 'notre-dame'
          };
          const updatedWithServerId = updatedStudents.map(s => 
            s.id === newStudent.id ? serverStudent : s
          );
          saveToLocalStorage({ students: updatedWithServerId });
          return serverStudent;
        }
      }
    } catch (error) {
      console.log('Offline mode: Student saved locally');
    }

    return newStudent;
  },

  async updateStudent(id: string, studentData: Partial<Student>): Promise<Student> {
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('students')
          .update({
            name: studentData.name,
            student_id: studentData.studentId,
            email: studentData.email,
            course: (studentData as any).course ?? studentData.department,
            year: (studentData as any).year,
            contact_number: (studentData as any).contactNumber,
            rfid: studentData.rfid
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          const updatedStudent = {
            id: data.id,
            name: data.name,
            studentId: data.student_id,
            email: data.email || '',
            department: data.course,
            course: (data as any).course || '',
            year: (data as any).year || '',
            contactNumber: (data as any).contact_number || '',
            biometricData: data.biometric_data || '',
            rfid: data.rfid || '',
            library: data.library as 'notre-dame' | 'ibed' || 'notre-dame'
          };

          // Update local storage
          const localData = await getFromLocalStorage();
          const updatedStudents = localData.students.map(s => 
            s.id === id ? updatedStudent : s
          );
          await saveToLocalStorage({ students: updatedStudents });
          
          return updatedStudent;
        }
      }
    } catch (error) {
      console.error('Error updating student:', error);
    }

    // Fallback: update locally only
    const localData = await getFromLocalStorage();
    const updatedStudents = localData.students.map(s => 
      s.id === id ? { ...s, ...studentData, _dirty: true, _dirtyUpdatedAt: new Date().toISOString() } : s
    );
    await saveToLocalStorage({ students: updatedStudents });
    
    return { ...(localData.students.find(s => s.id === id) as any), ...studentData, id } as Student;
  },

  async findStudentByBarcode(barcode: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`student_id.eq.${barcode},id.eq.${barcode}`)
      .maybeSingle();

    if (error) {
      console.error('Error finding student by barcode:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      studentId: data.student_id,
      email: data.email || '',
      department: data.course,
      course: (data as any).course || '',
      year: (data as any).year || '',
      contactNumber: (data as any).contact_number || '',
      biometricData: data.biometric_data || '',
      rfid: data.rfid || '',
      library: data.library as 'notre-dame' | 'ibed' || 'notre-dame'
    };
  },

  async findStudentByBiometric(biometricData: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('biometric_data', biometricData)
      .maybeSingle();

    if (error) {
      console.error('Error finding student by biometric:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      studentId: data.student_id,
      email: data.email || '',
      department: data.course,
      course: (data as any).course || '',
      year: (data as any).year || '',
      contactNumber: (data as any).contact_number || '',
      biometricData: data.biometric_data || '',
      rfid: data.rfid || '',
      library: data.library as 'notre-dame' | 'ibed' || 'notre-dame'
    };
  },

  async findStudentByRFID(rfidData: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('rfid', rfidData)
      .maybeSingle();

    if (error) {
      console.error('Error finding student by RFID:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      studentId: data.student_id,
      email: data.email || '',
      department: data.course,
      course: (data as any).course || '',
      year: (data as any).year || '',
      contactNumber: (data as any).contact_number || '',
      biometricData: data.biometric_data || '',
      rfid: data.rfid || '',
      library: data.library as 'notre-dame' | 'ibed' || 'notre-dame'
    };
  }
};
