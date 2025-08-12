import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Edit, 
  Download, 
  Search, 
  Smartphone, 
  Wifi, 
  Activity,
  BarChart3,
  Clock,
  Calendar,
  Users,
  RefreshCw
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import RFIDDataManager from '@/components/RFIDDataManager';
import RFIDScanner from '@/components/RFIDScanner';
import { supabaseService } from '@/services/supabaseService';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';
import { toast } from '@/components/ui/use-toast';
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';
import { ChartTimeSeries, ChartCourseDistribution } from '@/components/analytics/ReportCharts';

const EnhancedLibraryStaffPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('add-student');
  const [rfidDeviceConnected, setRfidDeviceConnected] = useState(false);
  // Manage Students filters
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  
  // Form states
  const [newStudent, setNewStudent] = useState({
    name: '',
    studentId: '',
    email: '',
    course: '',
    year: '',
    contactNumber: '',
    rfid: ''
  });
  
  const [isRFIDScannerActive, setIsRFIDScannerActive] = useState(false);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editRFIDScannerActive, setEditRFIDScannerActive] = useState(false);
  
  // Report filter states
  const [reportFilter, setReportFilter] = useState({
    period: 'today',
    studentId: '',
    reportType: 'attendance'
  });

  useEffect(() => {
    loadData();
    checkRFIDDevice();
  }, []);

  const checkRFIDDevice = async () => {
    try {
      // Check if navigator.usb is available (for USB RFID devices)
      if ('usb' in navigator) {
        const devices = await (navigator as any).usb.getDevices();
        // Look for common RFID device vendor IDs
        const rfidVendorIds = [0x072f, 0x08ff, 0x0bda, 0x1a86]; // Common RFID reader vendor IDs
        const hasRfidDevice = devices.some((device: any) => 
          rfidVendorIds.includes(device.vendorId)
        );
        setRfidDeviceConnected(hasRfidDevice);
      } else {
        // Fallback: assume no RFID device if WebUSB not supported
        setRfidDeviceConnected(false);
      }
    } catch (error) {
      console.log('Could not check RFID device status:', error);
      setRfidDeviceConnected(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, attendanceData] = await Promise.all([
        supabaseService.getStudents(),
        supabaseService.getAttendanceRecords()
      ]);

      setStudents(studentsData);
      setAttendanceRecords(attendanceData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      if (!newStudent.name || !newStudent.studentId || !newStudent.email || !newStudent.course || !newStudent.year || !newStudent.contactNumber) {
        toast({
          title: "Error",
          description: "Name, Student ID, Email, Course, Year, and Contact Number are required",
          variant: "destructive",
        });
        return;
      }

      const studentData: Omit<Student, 'id'> = {
        ...newStudent,
        registrationDate: new Date(),
      };

      await supabaseService.addStudent(studentData);
      
      toast({
        title: "Success",
        description: "Student added successfully",
      });

      setNewStudent({
        name: '',
        studentId: '',
        email: '',
        course: '',
        year: '',
        contactNumber: '',
        rfid: ''
      });
      setIsRFIDScannerActive(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      });
    }
  };

  const handleEditStudent = async () => {
    try {
      if (!editingStudent) return;

      await supabaseService.updateStudent(editingStudent.id, editingStudent);
      
      toast({
        title: "Success",
        description: "Student updated successfully",
      });

      setEditingStudent(null);
      setEditRFIDScannerActive(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student",
        variant: "destructive",
      });
    }
  };

  const getFilteredRecords = () => {
    let filtered = attendanceRecords;
    const now = new Date();

    // Filter by period
    switch (reportFilter.period) {
      case 'today':
        filtered = filtered.filter(record => 
          new Date(record.timestamp) >= startOfDay(now) &&
          new Date(record.timestamp) <= endOfDay(now)
        );
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        filtered = filtered.filter(record => 
          new Date(record.timestamp) >= startOfDay(yesterday) &&
          new Date(record.timestamp) <= endOfDay(yesterday)
        );
        break;
      case 'week':
        filtered = filtered.filter(record => 
          new Date(record.timestamp) >= subWeeks(now, 1)
        );
        break;
      case 'month':
        filtered = filtered.filter(record => 
          new Date(record.timestamp) >= subMonths(now, 1)
        );
        break;
    }

    // Filter by student if selected
    if (reportFilter.studentId && reportFilter.studentId !== "all") {
      filtered = filtered.filter(record => 
        record.studentId === reportFilter.studentId
      );
    }

    return filtered;
  };

  const generateAdvancedReport = () => {
    const filteredRecords = getFilteredRecords();
    
    if (reportFilter.reportType === 'analytics') {
      // Generate analytics report
      const uniqueStudents = new Set(filteredRecords.map(r => r.studentId)).size;
      const visitors = filteredRecords.filter(r => r.studentId === 'VISITOR').length;
      const avgVisitsPerDay = filteredRecords.length / 
        (reportFilter.period === 'today' ? 1 : 
         reportFilter.period === 'week' ? 7 : 30);

      const csvContent = [
        ['Library Analytics Report'],
        ['Period', reportFilter.period],
        ['Generated', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
        [''],
        ['Metric', 'Value'],
        ['Total Visits', filteredRecords.length.toString()],
        ['Unique Students', uniqueStudents.toString()],
        ['Visitors', visitors.toString()],
        ['Average Visits/Day', avgVisitsPerDay.toFixed(1)],
        [''],
        ['Detailed Records'],
        ['Student Name', 'Student ID', 'Date', 'Time', 'Type']
      ].concat(
        filteredRecords.map(record => [
          record.studentName,
          record.studentId,
          format(new Date(record.timestamp), 'yyyy-MM-dd'),
          format(new Date(record.timestamp), 'HH:mm:ss'),
          record.studentId === 'VISITOR' ? 'Visitor' : 'Student'
        ])
      ).map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `library-analytics-${reportFilter.period}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } else {
      // Generate attendance report
      const csvContent = [
        ['Student Name', 'Student ID', 'Date', 'Time', 'Purpose', 'Contact'],
        ...filteredRecords.map(record => [
          record.studentName,
          record.studentId,
          format(new Date(record.timestamp), 'yyyy-MM-dd'),
          format(new Date(record.timestamp), 'HH:mm:ss'),
          record.purpose || 'Library Visit',
          record.contact || 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `library-attendance-${reportFilter.period}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    }

    toast({
      title: "Success",
      description: "Report exported successfully",
    });
  };

  const filteredStudents = students
    .filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(student => (courseFilter === 'all' || (student.course || student.department || '').toLowerCase() === courseFilter.toLowerCase()))
    .filter(student => (yearFilter === 'all' || (student.year || '').toLowerCase() === yearFilter.toLowerCase()));

  // Quick stats
  const todayRecords = attendanceRecords.filter(record => 
    new Date(record.timestamp).toDateString() === new Date().toDateString()
  );
  const uniqueStudentsToday = new Set(todayRecords.map(r => r.studentId)).size;
  const visitorsToday = todayRecords.filter(r => r.studentId === 'VISITOR').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading staff panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton to="/" />
        </div>
        
        {/* Header with real-time stats */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <Smartphone className="h-10 w-10" />
              Enhanced Library Staff Panel
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="ml-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-xl text-gray-600">Advanced Student Management & Analytics</p>
          
          {/* Real-time stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-green-500 text-white">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{todayRecords.length}</div>
                <p className="text-sm">Today's Visits</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500 text-white">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{uniqueStudentsToday}</div>
                <p className="text-sm">Unique Students</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-500 text-white">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{visitorsToday}</div>
                <p className="text-sm">Visitors Today</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500 text-white">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{students.length}</div>
                <p className="text-sm">Total Students</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="add-student">Add Student</TabsTrigger>
            <TabsTrigger value="edit-students">Manage Students</TabsTrigger>
            <TabsTrigger value="rfid-manager">RFID Manager</TabsTrigger>
            <TabsTrigger value="reports">Advanced Reports</TabsTrigger>
            <TabsTrigger value="analytics">Live Analytics</TabsTrigger>
          </TabsList>

          {/* Add Student Tab - Enhanced */}
          <TabsContent value="add-student">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  Add New Student
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Student Name *</Label>
                    <Input
                      id="name"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      placeholder="Enter full name"
                      className="text-lg p-3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentId">Student ID *</Label>
                    <Input
                      id="studentId"
                      value={newStudent.studentId}
                      onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                      placeholder="Enter student ID (for RF ID)"
                      className="text-lg p-3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                      placeholder="Enter email"
                      className="text-lg p-3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="course">Course *</Label>
                    <Input
                      id="course"
                      value={newStudent.course}
                      onChange={(e) => setNewStudent({...newStudent, course: e.target.value})}
                      placeholder="Enter course/program"
                      className="text-lg p-3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year Level *</Label>
                     <Select value={newStudent.year} onValueChange={(value) => setNewStudent({...newStudent, year: value})}>
                       <SelectTrigger className="text-lg p-3">
                         <SelectValue placeholder="Select year" />
                       </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                        <SelectItem value="graduate">Graduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contactNumber">Contact Number *</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      value={newStudent.contactNumber}
                      onChange={(e) => setNewStudent({...newStudent, contactNumber: e.target.value})}
                      placeholder="Enter contact number"
                      className="text-lg p-3"
                    />
                  </div>
                </div>
                
                {/* RFID Scanner Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">RFID Card Assignment</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={checkRFIDDevice}
                        >
                          Check Device
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsRFIDScannerActive(!isRFIDScannerActive)}
                          disabled={!rfidDeviceConnected}
                          className="ml-auto"
                        >
                          {isRFIDScannerActive ? 'Deactivate Scanner' : 'Activate Scanner'}
                        </Button>
                      </div>
                    </div>
                    
                    {!rfidDeviceConnected && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          No RFID device detected. Please connect an RFID reader to use this feature.
                        </p>
                      </div>
                    )}
                   
                   <RFIDScanner
                     onRFIDDetected={(rfidData) => setNewStudent({...newStudent, rfid: rfidData})}
                     isActive={isRFIDScannerActive}
                     currentRFID={newStudent.rfid}
                   />
                 </div>
                 
                 <Button onClick={handleAddStudent} className="w-full text-lg py-3" size="lg">
                   <UserPlus className="mr-2" />
                   Add Student to System
                 </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Student Management */}
          <TabsContent value="edit-students">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-6 w-6" />
                  Student Management
                </CardTitle>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <Input
                      placeholder="Search by name or student ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    <Badge variant="outline">{filteredStudents.length} students</Badge>
                  </div>
                  <div className="flex items-center gap-2 md:ml-auto">
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {[...new Set(students.map(s => (s.course || s.department || '').trim()).filter(Boolean))].map((course) => (
                          <SelectItem key={course} value={course}>{course}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {[...new Set(students.map(s => (s.year || '').trim()).filter(Boolean))].map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{student.name}</p>
                            <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                            <div className="flex gap-2 mt-1">
                              {student.course && <Badge variant="outline">{student.course}</Badge>}
                              {student.year && <Badge variant="outline">{student.year}th Year</Badge>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setEditingStudent(student)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Edit Student Modal */}
                {editingStudent && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md">
                      <CardHeader>
                        <CardTitle>Edit Student Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={editingStudent.name}
                            onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Student ID</Label>
                          <Input
                            value={editingStudent.studentId}
                            onChange={(e) => setEditingStudent({...editingStudent, studentId: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            value={editingStudent.email || ''}
                            onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Course</Label>
                          <Input
                            value={editingStudent.course || ''}
                            onChange={(e) => setEditingStudent({...editingStudent, course: e.target.value})}
                          />
                        </div>
                        
                        {/* RFID Section - only show if student doesn't have RFID */}
                        {!editingStudent.rfid && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="font-semibold">Add RFID Card</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditRFIDScannerActive(!editRFIDScannerActive)}
                                disabled={!rfidDeviceConnected}
                              >
                                {editRFIDScannerActive ? 'Deactivate Scanner' : 'Activate Scanner'}
                              </Button>
                            </div>
                            
                            {!rfidDeviceConnected && (
                              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                No RFID device detected
                              </div>
                            )}
                            
                            <RFIDScanner
                              onRFIDDetected={(rfidData) => setEditingStudent({...editingStudent, rfid: rfidData})}
                              isActive={editRFIDScannerActive}
                              currentRFID={editingStudent.rfid || ''}
                            />
                          </div>
                        )}
                        
                        {/* Show current RFID if student already has one */}
                        {editingStudent.rfid && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <Label className="text-sm font-semibold text-green-800">Current RFID:</Label>
                            <p className="text-sm text-green-700 mt-1">{editingStudent.rfid}</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button onClick={handleEditStudent} className="flex-1">
                            Save Changes
                          </Button>
                          <Button 
                            onClick={() => {
                              setEditingStudent(null);
                              setEditRFIDScannerActive(false);
                            }} 
                            variant="outline" 
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RFID Manager Tab */}
          <TabsContent value="rfid-manager">
            <RFIDDataManager students={students} onDataUpdated={loadData} />
          </TabsContent>

          {/* Enhanced Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-6 w-6" />
                  Advanced Report Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Report Type</Label>
                     <Select value={reportFilter.reportType} onValueChange={(value) => setReportFilter({...reportFilter, reportType: value})}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select report type" />
                       </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attendance">Attendance Report</SelectItem>
                        <SelectItem value="analytics">Analytics Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Time Period</Label>
                     <Select value={reportFilter.period} onValueChange={(value) => setReportFilter({...reportFilter, period: value})}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select period" />
                       </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Specific Student (Optional)</Label>
                     <Select value={reportFilter.studentId} onValueChange={(value) => setReportFilter({...reportFilter, studentId: value})}>
                       <SelectTrigger>
                         <SelectValue placeholder="All students" />
                       </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                         {students.slice(0, 20).map((student) => (
                           <SelectItem key={student.id} value={student.studentId || 'no-id'}>
                             {student.name} ({student.studentId || 'No ID'})
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Report Preview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Records:</span>
                        <span className="font-semibold ml-2">{getFilteredRecords().length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Period:</span>
                        <span className="font-semibold ml-2 capitalize">{reportFilter.period}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="font-semibold ml-2 capitalize">{reportFilter.reportType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Format:</span>
                        <span className="font-semibold ml-2">CSV</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Dashboard */}
                <div className="space-y-4">
                  <p className="text-lg font-semibold">Advanced Dashboard</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-2">
                      <ChartTimeSeries attendanceRecords={getFilteredRecords()} />
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <ChartCourseDistribution attendanceRecords={getFilteredRecords()} students={students} />
                    </div>
                  </div>
                </div>

                <Button onClick={generateAdvancedReport} size="lg" className="w-full">
                  <Download className="mr-2" />
                  Generate & Download Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Today's Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <span>Total Visits</span>
                      <Badge className="bg-blue-500">{todayRecords.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span>Unique Students</span>
                      <Badge className="bg-green-500">{uniqueStudentsToday}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                      <span>Visitors</span>
                      <Badge className="bg-orange-500">{visitorsToday}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                      <span>Current Hour</span>
                      <Badge className="bg-purple-500">
                        {todayRecords.filter(r => 
                          new Date(r.timestamp).getHours() === new Date().getHours()
                        ).length} visits
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-3 rounded ${rfidDeviceConnected ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2">
                        <Wifi className={`h-4 w-4 ${rfidDeviceConnected ? 'text-green-500' : 'text-red-500'}`} />
                        <span>RF ID Scanner</span>
                      </div>
                      <Badge className={rfidDeviceConnected ? 'bg-green-500' : 'bg-red-500'}>
                        {rfidDeviceConnected ? 'Connected' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span>Database Connection</span>
                      </div>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Last Update</span>
                      </div>
                      <Badge variant="outline">{format(new Date(), 'HH:mm:ss')}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span>Mobile App Ready</span>
                      </div>
                      <Badge className="bg-purple-500">Available</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedLibraryStaffPage;