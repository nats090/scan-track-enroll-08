
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Download, RefreshCw, User } from 'lucide-react';
import { Student } from '@/types/Student';
import { toast } from '@/components/ui/use-toast';
import QRCode from 'qrcode';
import ImageUpload from './ImageUpload';

interface QRCodeRegistrationProps {
  onStudentRegistered: (student: Student) => void;
  students: Student[];
}

const QRCodeRegistration = ({ onStudentRegistered, students }: QRCodeRegistrationProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [studentData, setStudentData] = useState({
    name: '',
    studentId: '',
    email: '',
    department: 'none',
    level: 'none',
    shift: 'none'
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const getDepartmentOptions = () => {
    if (studentData.level === 'college') {
      return [
        { value: 'none', label: 'No department assigned' },
        { value: 'CECE', label: 'CECE (Civil Engineering & Computer Engineering)' },
        { value: 'CTELAN', label: 'CTELAN (Teacher Education & Liberal Arts)' },
        { value: 'CBA', label: 'CBA (College of Business Administration)' }
      ];
    } else if (studentData.level === 'senior-high') {
      return [
        { value: 'none', label: 'No strand assigned' },
        { value: 'ABM', label: 'ABM (Accountancy, Business & Management)' },
        { value: 'STEM', label: 'STEM (Science, Technology, Engineering & Mathematics)' },
        { value: 'HUMSS', label: 'HUMSS (Humanities & Social Sciences)' },
        { value: 'GAS', label: 'GAS (General Academic Strand)' },
        { value: 'TVL-ICT', label: 'TVL-ICT (Information & Communications Technology)' },
        { value: 'TVL-HE', label: 'TVL-HE (Home Economics)' },
        { value: 'TVL-IA', label: 'TVL-IA (Industrial Arts)' }
      ];
    }
    return [{ value: 'none', label: 'No department assigned' }];
  };

  const generateQRCode = async () => {
    if (!studentData.name || !studentData.studentId) {
      toast({
        title: "Missing Information",
        description: "Please enter at least student name and ID",
        variant: "destructive",
      });
      return;
    }

    // Check if student already exists
    const existingStudent = students.find(s => 
      s.studentId === studentData.studentId
    );
    
    if (existingStudent) {
      toast({
        title: "Student Already Exists",
        description: `Student with ID ${studentData.studentId} is already registered`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Create a registration URL with student data as query parameters
      const currentUrl = window.location.origin;
      const registrationUrl = `${currentUrl}/?register=true&data=${encodeURIComponent(JSON.stringify(studentData))}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(registrationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrCodeDataUrl);
      
      toast({
        title: "QR Code Generated",
        description: "Students can scan this QR code to register directly on their phone",
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${studentData.studentId}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const registerStudent = () => {
    if (!studentData.name || !studentData.studentId) {
      toast({
        title: "Missing Information",
        description: "Please enter at least student name and ID",
        variant: "destructive",
      });
      return;
    }

    const newStudent: Student = {
      id: Date.now().toString(),
      name: studentData.name,
      studentId: studentData.studentId,
      email: studentData.email,
      department: studentData.department === 'none' ? undefined : studentData.department,
      level: studentData.level === 'none' ? undefined : studentData.level as 'elementary' | 'junior-high' | 'senior-high' | 'college',
      shift: (studentData.level === 'senior-high' && studentData.shift !== 'none') ? studentData.shift as 'morning' | 'afternoon' : undefined,
      profilePicture: profilePicture || undefined
    };

    onStudentRegistered(newStudent);
    
    // Reset form
    setStudentData({
      name: '',
      studentId: '',
      email: '',
      department: 'none',
      level: 'none',
      shift: 'none'
    });
    setProfilePicture(null);
    setQrCodeUrl('');
    
    toast({
      title: "Registration Successful",
      description: `${newStudent.name} has been registered successfully`,
    });
  };

  const clearForm = () => {
    setStudentData({
      name: '',
      studentId: '',
      email: '',
      department: 'none',
      level: 'none',
      shift: 'none'
    });
    setProfilePicture(null);
    setQrCodeUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <QrCode className="h-6 w-6" />
          QR Code Registration
        </h2>
        <p className="text-muted-foreground">
          Generate QR codes for student registration
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Student Information Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <ImageUpload
                currentImage={profilePicture || undefined}
                onImageChange={setProfilePicture}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter student full name"
                value={studentData.name}
                onChange={(e) => setStudentData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID *</Label>
              <Input
                id="studentId"
                placeholder="Enter student ID"
                value={studentData.studentId}
                onChange={(e) => setStudentData(prev => ({ ...prev, studentId: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={studentData.level}
                onValueChange={(value) => {
                  setStudentData(prev => ({ 
                    ...prev, 
                    level: value,
                    department: 'none', // Reset department when level changes
                    shift: 'none' // Reset shift when level changes
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No level assigned</SelectItem>
                  <SelectItem value="elementary">Elementary</SelectItem>
                  <SelectItem value="junior-high">Junior High</SelectItem>
                  <SelectItem value="senior-high">Senior High</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                {studentData.level === 'senior-high' ? 'Strand' : 'Department'}
              </Label>
              <Select
                value={studentData.department}
                onValueChange={(value) => setStudentData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${studentData.level === 'senior-high' ? 'strand' : 'department'}`} />
                </SelectTrigger>
                <SelectContent>
                  {getDepartmentOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show shift field only for SHS students */}
            {studentData.level === 'senior-high' && (
              <div className="space-y-2">
                <Label htmlFor="shift">Shift</Label>
                <Select
                  value={studentData.shift}
                  onValueChange={(value) => setStudentData(prev => ({ ...prev, shift: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No shift assigned</SelectItem>
                    <SelectItem value="morning">Morning Shift</SelectItem>
                    <SelectItem value="afternoon">Afternoon Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={studentData.email}
                onChange={(e) => setStudentData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={generateQRCode}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? 'Generating...' : 'Generate QR Code'}
              </Button>
              
              <Button
                onClick={clearForm}
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Generated QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrCodeUrl ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="Student QR Code" 
                    className="border rounded-lg shadow-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    QR Code for: <strong>{studentData.name}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Student ID: <strong>{studentData.studentId}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                    When scanned, this QR code will redirect students to the registration page on their phone
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button
                    onClick={registerStudent}
                    className="flex-1"
                  >
                    Register Student
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Enter student information and click "Generate QR Code" to create a QR code</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Fill in the student information in the form</p>
            <p>• Click "Generate QR Code" to create a QR code with the student data</p>
            <p>• Download the QR code image for the student to keep</p>
            <p>• When students scan the QR code on their phone, they'll be redirected to the registration page</p>
            <p>• Students can complete their registration directly on their mobile device</p>
            <p>• You can also click "Register Student" to add the student directly to the system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeRegistration;
