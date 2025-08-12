
export interface Student {
  id: string;
  name: string;
  studentId: string;
  email?: string;
  department?: string;
  course?: string;
  year?: string;
  level?: 'elementary' | 'junior-high' | 'senior-high' | 'college' | 'graduated' | 'transferred-out';
  shift?: 'morning' | 'afternoon'; // For SHS students
  lastScan?: Date;
  profilePicture?: string;
  biometricData?: string;
  barcode?: string;
  rfid?: string; // RFID data for check-in/check-out
  contactNumber?: string;
  registrationDate?: Date;
  library?: 'notre-dame' | 'ibed'; // Multi-library support
}
