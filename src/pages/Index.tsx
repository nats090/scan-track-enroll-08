import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import OfflineIndicator from '@/components/OfflineIndicator';
import LibrarySelector from '@/components/LibrarySelector';
import AppSidebar from '@/components/AppSidebar';
import Dashboard from '@/components/Dashboard';
import DataSyncPage from '@/pages/DataSyncPage';
import QRRegistrationPage from '@/pages/QRRegistrationPage';
import AttendancePage from '@/pages/AttendancePage';
import StudentsPage from '@/pages/StudentsPage';
import ProfileManagerPage from '@/pages/ProfileManagerPage';
import AdminPage from '@/pages/AdminPage';
import ScannerPage from '@/pages/ScannerPage';
import ThesisResearchPage from '@/pages/ThesisResearchPage';
import { Barcode } from 'lucide-react';
import { saveToLocalStorage, getFromLocalStorage } from '@/utils/offlineStorage';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useLibrary } from '@/contexts/LibraryContext';
import { supabaseService } from '@/services/supabaseService';
import { realtimeService } from '@/services/realtimeService';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const isOnline = useOnlineStatus();
  const { currentLibrary } = useLibrary();

  // Filter data based on current library
  const filteredStudents = students.filter(student => 
    !student.library || student.library === currentLibrary
  );
  const filteredAttendanceRecords = attendanceRecords.filter(record => 
    !record.library || record.library === currentLibrary
  );

  // Load data on component mount and setup realtime
  useEffect(() => {
    loadInitialData();
    
    // Setup realtime data updates
    realtimeService.setOnDataUpdateCallback((updatedStudents, updatedRecords) => {
      setStudents(updatedStudents);
      setAttendanceRecords(updatedRecords);
    });
    
    return () => {
      realtimeService.destroy();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      if (isOnline) {
        // Try to load from Supabase first
        try {
          const [studentsData, attendanceData] = await Promise.all([
            supabaseService.getStudents(),
            supabaseService.getAttendanceRecords()
          ]);

          const studentsWithLastScan = await Promise.all(
            studentsData.map(async (student) => {
              const lastScan = await supabaseService.getStudentLastScan(student.studentId);
              return { ...student, lastScan };
            })
          );

          setStudents(studentsWithLastScan);
          setAttendanceRecords(attendanceData);

          // Save to local storage as backup
          saveToLocalStorage({ 
            students: studentsWithLastScan, 
            attendanceRecords: attendanceData,
            lastSync: new Date().toISOString()
          });

          console.log('Data loaded from Supabase:', { students: studentsWithLastScan.length, records: attendanceData.length });
        } catch (error) {
          console.error('Error loading data from Supabase:', error);
          loadFromLocalStorage();
        }
      } else {
        // Load from local storage when offline
        loadFromLocalStorage();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = async () => {
    const offlineData = await getFromLocalStorage();
    if (offlineData.students.length > 0 || offlineData.attendanceRecords.length > 0) {
      setStudents(offlineData.students);
      setAttendanceRecords(offlineData.attendanceRecords.map(record => ({
        ...record,
        timestamp: new Date(record.timestamp)
      })));
      
      toast({
        title: "Offline Mode",
        description: "Data loaded from local storage",
      });
      
      console.log('Data loaded from local storage:', { students: offlineData.students.length, records: offlineData.attendanceRecords.length });
    }
  };

  // Save data to local storage whenever state changes
  useEffect(() => {
    if (!loading) {
      saveToLocalStorage({ students, attendanceRecords });
    }
  }, [students, attendanceRecords, loading]);

  const handleDataSynced = (syncedStudents: Student[], syncedRecords: AttendanceEntry[]) => {
    setStudents(syncedStudents);
    setAttendanceRecords(syncedRecords);
  };

  const handleDataImported = (importedStudents: Student[], importedRecords: AttendanceEntry[]) => {
    // Merge imported data with existing data
    const existingStudentIds = students.map(s => s.studentId);
    const newStudents = importedStudents.filter(s => !existingStudentIds.includes(s.studentId));
    
    const existingRecordIds = attendanceRecords.map(r => r.id);
    const newRecords = importedRecords.filter(r => !existingRecordIds.includes(r.id));
    
    setStudents(prev => [...prev, ...newStudents]);
    setAttendanceRecords(prev => [...prev, ...newRecords]);
  };

  const addStudentToState = (student: Student) => {
    setStudents(prev => [student, ...prev]);
  };

  const addAttendanceToState = (record: AttendanceEntry) => {
    setAttendanceRecords(prev => [record, ...prev]);
  };

  const updateStudentLastScan = (studentId: string) => {
    setStudents(prev => prev.map(s => 
      s.studentId === studentId 
        ? { ...s, lastScan: new Date() }
        : s
    ));
  };

  const updateStudentInState = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => 
      s.id === updatedStudent.id ? updatedStudent : s
    ));
  };

  const handleBarcodeDetected = async (barcode: string) => {
    console.log('Barcode detected:', barcode);
    
    try {
      let student: Student | null = null;
      
      if (isOnline) {
        student = await supabaseService.findStudentByBarcode(barcode);
      } else {
        // Find student in local storage when offline
        student = students.find(s => s.studentId === barcode || s.id === barcode) || null;
      }
      
      const newRecord: Omit<AttendanceEntry, 'id'> = {
        studentId: student?.studentId || 'Unknown',
        studentName: student?.name || 'Unknown Student',
        timestamp: new Date(),
        type: 'check-in', // Main page defaults to check-in
        barcode: barcode,
        method: 'barcode',
        library: currentLibrary
      };
      
      if (isOnline && student) {
        try {
          const savedRecord = await supabaseService.addAttendanceRecord(newRecord);
          addAttendanceToState(savedRecord);
          updateStudentLastScan(student.studentId);
        } catch (error) {
          // Fallback to local storage if Supabase fails
          const localRecord = { ...newRecord, id: Date.now().toString() };
          addAttendanceToState(localRecord);
        }
      } else {
        // Add to local storage when offline
        const localRecord = { ...newRecord, id: Date.now().toString() };
        addAttendanceToState(localRecord);
        if (student) updateStudentLastScan(student.studentId);
      }
      
      toast({
        title: student ? "Success" : "Warning",
        description: student 
          ? `Attendance recorded for ${student.name}` 
          : "Unknown barcode scanned",
        variant: student ? "default" : "destructive",
      });
      
    } catch (error) {
      console.error('Error processing barcode:', error);
      toast({
        title: "Error",
        description: "Failed to process barcode scan",
        variant: "destructive",
      });
    }
  };

  const handleRFIDDetected = async (rfidData: string) => {
    console.log('RFID detected:', rfidData);
    
    // Extract the UID from the formatted RFID data
    const rfidMatch = rfidData.match(/RFID:([A-F0-9]+):/);
    const rfidUID = rfidMatch ? rfidMatch[1] : rfidData;
    
    try {
      let student: Student | null = null;
      
      if (isOnline) {
        student = await supabaseService.findStudentByRFID(rfidUID);
      } else {
        // Find student in local storage when offline
        student = students.find(s => s.rfid === rfidUID) || null;
      }
      
      const newRecord: Omit<AttendanceEntry, 'id'> = {
        studentId: student?.studentId || 'Unknown',
        studentName: student?.name || 'Unknown Student',
        timestamp: new Date(),
        type: 'check-in', // Main page defaults to check-in
        method: 'rfid',
        library: currentLibrary
      };
      
      if (isOnline && student) {
        try {
          const savedRecord = await supabaseService.addAttendanceRecord(newRecord);
          addAttendanceToState(savedRecord);
          updateStudentLastScan(student.studentId);
        } catch (error) {
          // Fallback to local storage if Supabase fails
          const localRecord = { ...newRecord, id: Date.now().toString() };
          addAttendanceToState(localRecord);
        }
      } else {
        // Add to local storage when offline
        const localRecord = { ...newRecord, id: Date.now().toString() };
        addAttendanceToState(localRecord);
        if (student) updateStudentLastScan(student.studentId);
      }
      
      toast({
        title: student ? "Success" : "Warning",
        description: student 
          ? `RFID attendance recorded for ${student.name}` 
          : "Unknown RFID card scanned",
        variant: student ? "default" : "destructive",
      });
      
    } catch (error) {
      console.error('Error processing RFID:', error);
      toast({
        title: "Error",
        description: "Failed to process RFID scan",
        variant: "destructive",
      });
    }
  };

  // Keep the handleBiometricDetected function for backward compatibility but make it a no-op
  const handleBiometricDetected = async (biometricData: string) => {
    console.log('Biometric scanning disabled');
  };

  const handleStudentRegistered = async (newStudent: Student) => {
    try {
      // Add library information to the student
      const studentWithLibrary = { ...newStudent, library: currentLibrary };
      
      if (isOnline) {
        const savedStudent = await supabaseService.addStudent(studentWithLibrary);
        addStudentToState(savedStudent);
      } else {
        // Add to local storage when offline
        const localStudent = { ...studentWithLibrary, id: Date.now().toString() };
        addStudentToState(localStudent);
      }
      
      toast({
        title: "Success",
        description: `Student ${newStudent.name} registered successfully`,
      });
      
    } catch (error) {
      console.error('Error registering student:', error);
      toast({
        title: "Error",
        description: "Failed to register student",
        variant: "destructive",
      });
    }
  };

  const handleVisitorEntry = async (visitorData: { name: string; purpose: string; contact: string }) => {
    try {
      const visitorRecord: Omit<AttendanceEntry, 'id'> = {
        studentId: 'VISITOR',
        studentName: visitorData.name,
        timestamp: new Date(),
        type: 'check-in', // Visitors default to check-in
        method: 'manual',
        purpose: visitorData.purpose,
        contact: visitorData.contact,
        library: currentLibrary
      };
      
      if (isOnline) {
        const savedRecord = await supabaseService.addAttendanceRecord(visitorRecord);
        addAttendanceToState(savedRecord);
      } else {
        // Add to local storage when offline
        const localRecord = { ...visitorRecord, id: Date.now().toString() };
        addAttendanceToState(localRecord);
      }
      
      toast({
        title: "Success",
        description: `Visitor entry recorded for ${visitorData.name}`,
      });
      
    } catch (error) {
      console.error('Error recording visitor entry:', error);
      toast({
        title: "Error",
        description: "Failed to record visitor entry",
        variant: "destructive",
      });
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard students={filteredStudents} attendanceRecords={filteredAttendanceRecords} />;
      case 'scanner':
        return (
          <ScannerPage
            onBarcodeDetected={handleBarcodeDetected}
            onBiometricDetected={handleBiometricDetected}
            onRFIDDetected={handleRFIDDetected}
            onStudentRegistered={handleStudentRegistered}
            onVisitorEntry={handleVisitorEntry}
          />
        );
      case 'thesis-research':
        return <ThesisResearchPage />;
      case 'sync':
        return <DataSyncPage onDataSynced={handleDataSynced} />;
      case 'qrcode':
        return (
          <QRRegistrationPage 
            onStudentRegistered={handleStudentRegistered}
            students={filteredStudents}
          />
        );
      case 'attendance':
        return <AttendancePage records={filteredAttendanceRecords} />;
      case 'students':
        return <StudentsPage students={filteredStudents} />;
      case 'profiles':
        return (
          <ProfileManagerPage
            students={filteredStudents}
            onUpdateStudent={updateStudentInState}
          />
        );
      case 'admin':
        return (
          <AdminPage 
            students={filteredStudents}
            attendanceRecords={filteredAttendanceRecords}
            onDataImported={handleDataImported}
            onUpdateStudent={updateStudentInState}
          />
        );
      default:
        return <Dashboard students={filteredStudents} attendanceRecords={filteredAttendanceRecords} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading library system...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          attendanceCount={filteredAttendanceRecords.length}
          studentsCount={filteredStudents.length}
        />
        
        <SidebarInset className="flex-1">
          <div className="p-6 space-y-6">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg">
                      <Barcode className="h-8 w-8 text-primary-foreground" />
                    </div>
                    Library Attendance System
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Advanced student management with barcode authentication
                  </p>
                </div>
              </div>
              <LibrarySelector />
            </div>

            {/* Offline Indicator */}
            <OfflineIndicator />

            {/* Main Content */}
            <Card className="shadow-lg border-0 bg-card/90 backdrop-blur-sm min-h-[400px]">
              <CardContent className="p-6">
                {renderActiveSection()}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
