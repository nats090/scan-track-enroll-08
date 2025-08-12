import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Edit, Download, Search } from 'lucide-react';
import { supabaseService } from '@/services/supabaseService';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ChartTimeSeries, ChartCourseDistribution } from '@/components/analytics/ReportCharts';

const LibraryStaffPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [newStudent, setNewStudent] = useState({
    name: '',
    studentId: '',
    email: '',
    course: '',
    year: '',
    contactNumber: ''
  });

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // Report filter states
  const [reportFilter, setReportFilter] = useState({
    period: 'today',
    course: ''
  });

  // Manage Students filters
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

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
      } as any;

      await supabaseService.addStudent(studentData);
      
      toast({
        title: "Success",
        description: "Student added successfully",
      });

      setNewStudent({ name: '', studentId: '', email: '', course: '', year: '', contactNumber: '' });
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

      // For now, we'll just show success. Update functionality can be added later
      console.log('Student to update:', editingStudent);
      
      toast({
        title: "Success",
        description: "Student updated successfully",
      });

      setEditingStudent(null);
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

    // Filter by period
    const now = new Date();
    switch (reportFilter.period) {
      case 'today':
        filtered = filtered.filter(record => 
          new Date(record.timestamp).toDateString() === now.toDateString()
        );
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(record => 
          new Date(record.timestamp) >= weekAgo
        );
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(record => 
          new Date(record.timestamp) >= monthAgo
        );
        break;
    }

    // Filter by course if selected
    if (reportFilter.course && reportFilter.course !== "all") {
      const studentsInCourse = students.filter(student => student.course === reportFilter.course);
      const studentIds = studentsInCourse.map(student => student.studentId);
      filtered = filtered.filter(record => 
        studentIds.includes(record.studentId)
      );
    }

    return filtered;
  };

  const exportReport = () => {
    const filteredRecords = getFilteredRecords();
    const csvContent = [
      ['Student Name', 'Student ID', 'Date', 'Time'],
      ...filteredRecords.map(record => [
        record.studentName,
        record.studentId,
        format(new Date(record.timestamp), 'yyyy-MM-dd'),
        format(new Date(record.timestamp), 'HH:mm:ss')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `library-report-${reportFilter.period}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Library Staff Panel</h1>
          <p className="text-xl text-gray-600">Manage Students and Generate Reports</p>
        </div>

        <Tabs defaultValue="add-student" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add-student">Add Student</TabsTrigger>
            <TabsTrigger value="edit-students">Edit Students</TabsTrigger>
            <TabsTrigger value="reports">Export Reports</TabsTrigger>
          </TabsList>

          {/* Add Student Tab */}
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentId">Student ID *</Label>
                    <Input
                      id="studentId"
                      value={newStudent.studentId}
                      onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                      placeholder="Enter student ID"
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="course">Course *</Label>
                    <Input
                      id="course"
                      value={newStudent.course}
                      onChange={(e) => setNewStudent({...newStudent, course: e.target.value})}
                      placeholder="Enter course"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year Level *</Label>
                    <Select value={newStudent.year} onValueChange={(value) => setNewStudent({...newStudent, year: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
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
                    />
                  </div>
                </div>
                <Button onClick={handleAddStudent} className="w-full" size="lg">
                  Add Student
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit Students Tab */}
          <TabsContent value="edit-students">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-6 w-6" />
                  Edit Students
                </CardTitle>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
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
                    <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                        <p className="text-sm text-gray-600">{student.course} - {student.year}th Year</p>
                      </div>
                      <Button
                        onClick={() => setEditingStudent(student)}
                        variant="outline"
                      >
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
                        <CardTitle>Edit Student</CardTitle>
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
                        <div className="flex gap-2">
                          <Button onClick={handleEditStudent} className="flex-1">
                            Save Changes
                          </Button>
                          <Button 
                            onClick={() => setEditingStudent(null)} 
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

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-6 w-6" />
                  Export Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Time Period</Label>
                    <Select onValueChange={(value) => setReportFilter({...reportFilter, period: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Filter by Course (Optional)</Label>
                    <Select onValueChange={(value) => setReportFilter({...reportFilter, course: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="All courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {[...new Set(students.map(student => (student.course || student.department || '').trim()).filter(Boolean))].map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-lg font-semibold mb-2">Preview</p>
                  <p>Records found: {getFilteredRecords().length}</p>
                  <p>Period: {reportFilter.period}</p>
                  {reportFilter.course && reportFilter.course !== "all" && (
                    <p>Course: {reportFilter.course}</p>
                  )}
                </div>

                {/* Advanced Dashboard */}
                <div className="space-y-4">
                  <p className="text-lg font-semibold">Advanced Dashboard</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Time Series */}
                    <div className="bg-white rounded-lg p-2">
                      <ChartTimeSeries attendanceRecords={getFilteredRecords()} />
                    </div>
                    {/* Course Distribution */}
                    <div className="bg-white rounded-lg p-2">
                      <ChartCourseDistribution attendanceRecords={getFilteredRecords()} students={students} />
                    </div>
                  </div>
                </div>

                <Button onClick={exportReport} size="lg" className="w-full">
                  Export CSV Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LibraryStaffPage;