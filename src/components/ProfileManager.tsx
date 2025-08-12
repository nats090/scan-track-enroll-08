
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Student } from '@/types/Student';
import { Search, Edit, User, Users, Filter, CheckSquare, Square, Edit3, GraduationCap, Trash } from 'lucide-react';
import StudentProfile from './StudentProfile';
import BulkEditDialog from './BulkEditDialog';
import { toast } from 'sonner';

interface ProfileManagerProps {
  students: Student[];
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
}

const ProfileManager = ({ students, onUpdateStudent, onDeleteStudent }: ProfileManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Get unique departments for filter dropdown
  const uniqueDepartments = Array.from(new Set(students.map(s => s.department).filter(Boolean)));

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === 'all' || student.department === departmentFilter;
    const matchesLevel = levelFilter === 'all' || student.level === levelFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && student.lastScan) ||
      (statusFilter === 'inactive' && !student.lastScan);

    return matchesSearch && matchesDepartment && matchesStatus && matchesLevel;
  });

  // Group students by level
  const groupedStudents = {
    elementary: filteredStudents.filter(s => s.level === 'elementary'),
    'junior-high': filteredStudents.filter(s => s.level === 'junior-high'),
    'senior-high': filteredStudents.filter(s => s.level === 'senior-high'),
    college: filteredStudents.filter(s => s.level === 'college'),
    graduated: filteredStudents.filter(s => s.level === 'graduated'),
    'transferred-out': filteredStudents.filter(s => s.level === 'transferred-out'),
    unassigned: filteredStudents.filter(s => !s.level)
  };

  const levelLabels = {
    elementary: 'Elementary',
    'junior-high': 'Junior High',
    'senior-high': 'Senior High',
    college: 'College',
    graduated: 'Graduated',
    'transferred-out': 'Transferred Out',
    unassigned: 'Unassigned Level'
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowProfile(true);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    onUpdateStudent(updatedStudent);
    setShowProfile(false);
    setSelectedStudent(null);
    toast.success('Student profile updated successfully');
  };

  const handleDeleteStudent = (studentId: string) => {
    if (onDeleteStudent) {
      onDeleteStudent(studentId);
      toast.success('Student deleted successfully');
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleBulkUpdate = (updates: Partial<Student>) => {
    selectedStudents.forEach(studentId => {
      const student = students.find(s => s.id === studentId);
      if (student) {
        onUpdateStudent({ ...student, ...updates });
      }
    });
    setSelectedStudents([]);
    setShowBulkEdit(false);
    toast.success(`Updated ${selectedStudents.length} student(s) successfully`);
  };

  const handleBulkDelete = () => {
    if (onDeleteStudent) {
      selectedStudents.forEach(studentId => {
        onDeleteStudent(studentId);
      });
      setSelectedStudents([]);
      toast.success(`Deleted ${selectedStudents.length} student(s) successfully`);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setLevelFilter('all');
  };

  const renderStudentCard = (student: Student) => (
    <Card key={student.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Selection Checkbox */}
            <Checkbox
              checked={selectedStudents.includes(student.id)}
              onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
            />

            {/* Profile Picture */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {student.profilePicture ? (
                <img
                  src={student.profilePicture}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            {/* Student Info */}
            <div>
              <h3 className="font-semibold text-lg">{student.name}</h3>
              <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
              <div className="flex gap-2 mt-1">
                {student.level && (
                  <Badge variant="outline" className="text-xs">
                    {levelLabels[student.level as keyof typeof levelLabels]}
                  </Badge>
                )}
                {student.email && (
                  <Badge variant="outline" className="text-xs">
                    {student.email}
                  </Badge>
                )}
                {student.department && (
                  <Badge variant="secondary" className="text-xs">
                    {student.department}
                  </Badge>
                )}
                <Badge variant={student.lastScan ? "default" : "secondary"} className="text-xs">
                  {student.lastScan ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {student.lastScan && (
              <div className="text-right mr-4">
                <p className="text-xs text-muted-foreground">Last seen</p>
                <p className="text-sm font-medium">
                  {student.lastScan.toLocaleDateString()}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditStudent(student)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {onDeleteStudent && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Student</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {student.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteStudent(student.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Users className="h-6 w-6" />
          Profile Manager
        </h2>
        <p className="text-muted-foreground">
          Search, filter, edit, and manage student profiles
        </p>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, student ID, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="elementary">Elementary</SelectItem>
                  <SelectItem value="junior-high">Junior High</SelectItem>
                  <SelectItem value="senior-high">Senior High</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="transferred-out">Transferred Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map(department => (
                    <SelectItem key={department} value={department!}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="active">Recently Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedStudents([])}
                >
                  Clear Selection
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setShowBulkEdit(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>
                {onDeleteStudent && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash className="h-4 w-4 mr-2" />
                        Bulk Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Selected Students</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedStudents.length} selected student(s)? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleBulkDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                Select All ({filteredStudents.length} students)
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Student List */}
      <div className="space-y-6">
        {filteredStudents.length > 0 ? (
          Object.entries(groupedStudents).map(([level, levelStudents]) => {
            if (levelStudents.length === 0) return null;
            
            return (
              <div key={level} className="space-y-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">
                    {levelLabels[level as keyof typeof levelLabels]} ({levelStudents.length})
                  </h3>
                  <Separator className="flex-1" />
                </div>
                <div className="grid gap-4">
                  {levelStudents.map(renderStudentCard)}
                </div>
              </div>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all' || levelFilter !== 'all'
                  ? "No students match your search criteria"
                  : "No students registered yet"}
              </p>
              {(searchTerm || departmentFilter !== 'all' || statusFilter !== 'all' || levelFilter !== 'all') && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Student Profile Edit Dialog */}
      {selectedStudent && (
        <StudentProfile
          student={selectedStudent}
          onUpdateStudent={handleUpdateStudent}
          onClose={() => {
            setShowProfile(false);
            setSelectedStudent(null);
          }}
          isOpen={showProfile}
        />
      )}

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        onUpdate={handleBulkUpdate}
        selectedCount={selectedStudents.length}
      />
    </div>
  );
};

export default ProfileManager;
