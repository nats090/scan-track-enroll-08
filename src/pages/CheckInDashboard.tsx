import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogIn, Users, Clock, UserPlus, Wifi, Activity, RefreshCw } from 'lucide-react';
import { attendanceService } from '@/services/attendanceService';
import { studentService } from '@/services/studentService';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import BackButton from '@/components/BackButton';

const CheckInDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<AttendanceEntry[]>([]);
  const [currentCount, setCurrentCount] = useState(0);
  const [visitorDialog, setVisitorDialog] = useState(false);
  const [studentDialog, setStudentDialog] = useState(false);
  const [studentSearchId, setStudentSearchId] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isRFIDActive, setIsRFIDActive] = useState(false);
  const [visitorData, setVisitorData] = useState({
    name: '',
    purpose: '',
    contact: '',
    organization: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, attendanceData] = await Promise.all([
        studentService.getStudents(),
        attendanceService.getAttendanceRecords()
      ]);

      setStudents(studentsData);
      
      // Get today's check-ins
      const today = new Date().toDateString();
      const todayRecords = attendanceData.filter(record => 
        new Date(record.timestamp).toDateString() === today
      );
      
      // Get recent check-ins only (last 10)
      const recentCheckIns = todayRecords
        .filter(record => record.type === 'check-in')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      
      const todayCheckInsCount = todayRecords.filter(record => record.type === 'check-in').length;
      
      setRecentCheckIns(recentCheckIns);
      setCurrentCount(todayCheckInsCount);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleVisitorCheckIn = async () => {
    try {
      if (!visitorData.name || !visitorData.purpose) {
        toast({
          title: "Error",
          description: "Name and purpose are required",
          variant: "destructive",
        });
        return;
      }

      const visitorRecord: Omit<AttendanceEntry, 'id'> = {
        studentId: 'VISITOR',
        studentName: visitorData.name,
        timestamp: new Date(),
        type: 'check-in',
        method: 'manual',
        purpose: visitorData.purpose,
        contact: visitorData.contact
      };

      await attendanceService.addAttendanceRecord(visitorRecord);
      
      toast({
        title: "Welcome!",
        description: `Visitor ${visitorData.name} checked in successfully`,
      });

      setVisitorData({ name: '', purpose: '', contact: '', organization: '' });
      setVisitorDialog(false);
      loadData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in visitor",
        variant: "destructive",
      });
    }
  };

  const handleStudentSearch = (searchId: string) => {
    setStudentSearchId(searchId);
    if (searchId.trim()) {
      const results = students.filter(student => 
        student.studentId.toLowerCase().includes(searchId.toLowerCase()) ||
        student.name.toLowerCase().includes(searchId.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleStudentCheckIn = async (student: Student) => {
    try {
      const studentRecord: Omit<AttendanceEntry, 'id'> = {
        studentId: student.studentId,
        studentName: student.name,
        timestamp: new Date(),
        type: 'check-in',
        method: 'manual'
      };

      await attendanceService.addAttendanceRecord(studentRecord);
      
      toast({
        title: "Welcome!",
        description: `${student.name} checked in successfully`,
      });

      setStudentSearchId('');
      setSearchResults([]);
      setStudentDialog(false);
      loadData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in student",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton to="/" />
        </div>
        
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-5xl font-bold text-green-700 flex items-center gap-4">
              <LogIn size={64} />
              Library Check In Dashboard
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <p className="text-2xl text-gray-600">Manual & Scanner Entry - Live Updates</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-semibold">System Online</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-green-500 text-white shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">{currentCount}</CardTitle>
              <p className="text-xl">Today's Check-ins</p>
            </CardHeader>
          </Card>

          <Card className="bg-blue-500 text-white shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">{students.length}</CardTitle>
              <p className="text-xl">Total Students</p>
            </CardHeader>
          </Card>

          <Card className="bg-purple-500 text-white shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                {format(new Date(), 'HH:mm')}
              </CardTitle>
              <p className="text-xl">{format(new Date(), 'MMM dd, yyyy')}</p>
            </CardHeader>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center gap-4">
            <Dialog open={studentDialog} onOpenChange={setStudentDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="text-xl px-8 py-6 bg-blue-500 hover:bg-blue-600">
                  <UserPlus className="mr-2" size={24} />
                  Manual Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center">Student Check In</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="student-search">Search Student ID or Name</Label>
                    <Input
                      id="student-search"
                      value={studentSearchId}
                      onChange={(e) => handleStudentSearch(e.target.value)}
                      placeholder="Enter student ID (e.g., 2021-033) or name"
                      className="text-lg p-3"
                    />
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <div className="text-sm font-medium p-2 bg-gray-50 border-b">
                        Found {searchResults.length} student(s):
                      </div>
                      {searchResults.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleStudentCheckIn(student)}
                          className="w-full p-3 text-left hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-blue-600">{student.name}</div>
                          <div className="text-sm text-gray-600">ID: {student.studentId}</div>
                          {student.email && (
                            <div className="text-xs text-gray-500">{student.email}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {studentSearchId && searchResults.length === 0 && (
                    <div className="text-center p-4 text-gray-500">
                      No students found matching "{studentSearchId}"
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => {
                      setStudentDialog(false);
                      setStudentSearchId('');
                      setSearchResults([]);
                    }} 
                    variant="outline" 
                    className="w-full text-lg py-3"
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

          <Dialog open={visitorDialog} onOpenChange={setVisitorDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="text-xl px-8 py-6 bg-orange-500 hover:bg-orange-600">
                <UserPlus className="mr-2" size={24} />
                Visitor Check In
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl text-center">Visitor Check In</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="visitor-name">Full Name *</Label>
                  <Input
                    id="visitor-name"
                    value={visitorData.name}
                    onChange={(e) => setVisitorData({...visitorData, name: e.target.value})}
                    placeholder="Enter visitor's full name"
                    className="text-lg p-3"
                  />
                </div>
                <div>
                  <Label htmlFor="visitor-purpose">Purpose of Visit *</Label>
                  <Textarea
                    id="visitor-purpose"
                    value={visitorData.purpose}
                    onChange={(e) => setVisitorData({...visitorData, purpose: e.target.value})}
                    placeholder="Why are you visiting? (e.g., Research, Study, Meeting)"
                    className="text-lg p-3"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="visitor-contact">Contact Number</Label>
                  <Input
                    id="visitor-contact"
                    value={visitorData.contact}
                    onChange={(e) => setVisitorData({...visitorData, contact: e.target.value})}
                    placeholder="Phone number (optional)"
                    className="text-lg p-3"
                  />
                </div>
                <div>
                  <Label htmlFor="visitor-org">Organization</Label>
                  <Input
                    id="visitor-org"
                    value={visitorData.organization}
                    onChange={(e) => setVisitorData({...visitorData, organization: e.target.value})}
                    placeholder="School/Company (optional)"
                    className="text-lg p-3"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleVisitorCheckIn} className="flex-1 text-lg py-3">
                    Check In
                  </Button>
                  <Button 
                    onClick={() => setVisitorDialog(false)} 
                    variant="outline" 
                    className="flex-1 text-lg py-3"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Recent Check-ins */}
        <Card className="shadow-xl">
          <CardHeader className="bg-green-100">
            <CardTitle className="text-3xl text-center flex items-center justify-center gap-3">
              <Activity size={32} />
              Recent Check-ins
            </CardTitle>
            <p className="text-center text-gray-600 text-lg">Live updates every 3 seconds</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4">
              {recentCheckIns.length > 0 ? recentCheckIns.map((record, index) => (
                <div
                  key={record.id}
                  className={`flex items-center justify-between p-6 rounded-lg shadow-md transition-all duration-300 ${
                    index === 0 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      record.studentId === 'VISITOR' ? 'bg-orange-500' : 'bg-green-500'
                    } text-white font-bold text-xl`}>
                      {record.studentId === 'VISITOR' ? 'V' : record.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{record.studentName}</p>
                      <p className="text-lg text-gray-600">
                        {record.studentId === 'VISITOR' ? 'Visitor' : `ID: ${record.studentId}`}
                      </p>
                      <p className="text-sm text-blue-600 font-medium">
                        Method: {record.method === 'manual' ? 'Manual Entry' : 'Scanner'}
                      </p>
                      {record.purpose && (
                        <p className="text-sm text-gray-500 italic">Purpose: {record.purpose}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-green-600">
                      {format(new Date(record.timestamp), 'HH:mm:ss')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(record.timestamp), 'MMM dd')}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <Users size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-2xl text-gray-500">No check-ins today yet</p>
                  <p className="text-lg text-gray-400">Waiting for RF ID scans...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="mt-8 text-center">
          <Card className={`inline-block ${isRFIDActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Wifi className={`${isRFIDActive ? 'text-green-500' : 'text-gray-400'}`} size={24} />
                <span className={`font-semibold ${isRFIDActive ? 'text-green-700' : 'text-gray-600'}`}>
                  RFID Scanner {isRFIDActive ? 'Connected' : 'Disconnected'}
                </span>
                <div className={`w-2 h-2 rounded-full ${isRFIDActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckInDashboard;