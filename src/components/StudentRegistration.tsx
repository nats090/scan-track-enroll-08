
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Student } from '@/types/Student';
import { UserPlus } from 'lucide-react';
import ImageUpload from './ImageUpload';
import OfflineIndicator from './OfflineIndicator';
import RFIDScanner from './RFIDScanner';
import { studentService } from '@/services/studentService';
import { toast } from '@/components/ui/use-toast';

interface StudentRegistrationProps {
  onStudentRegistered: (student: Student) => void;
  onClose: () => void;
  initialData?: string;
}

interface RegistrationForm {
  name: string;
  studentId: string;
  email: string;
  department: string;
  level: string;
  shift: string;
  course: string;
  year: string;
  contactNumber: string;
}

const StudentRegistration: React.FC<StudentRegistrationProps> = ({ 
  onStudentRegistered, 
  onClose, 
  initialData 
}) => {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [rfidData, setRfidData] = useState<string>('');
  
const form = useForm<RegistrationForm>({
  defaultValues: {
    name: '',
    studentId: '',
    email: '',
    department: 'none',
    level: 'none',
    shift: 'none',
    course: '',
    year: '',
    contactNumber: ''
  }
});

  const watchedLevel = form.watch('level');

  // Process initial data from QR code when component mounts
  useEffect(() => {
    if (initialData) {
      try {
        // Try to parse as JSON first
        const parsedData = JSON.parse(initialData);
        if (parsedData.name) form.setValue('name', parsedData.name);
        if (parsedData.studentId) form.setValue('studentId', parsedData.studentId);
        if (parsedData.email) form.setValue('email', parsedData.email);
        // Convert empty strings to 'none' for select fields
        if (parsedData.department) {
          form.setValue('department', parsedData.department === 'none' ? 'none' : parsedData.department);
        }
        if (parsedData.level) {
          form.setValue('level', parsedData.level === 'none' ? 'none' : parsedData.level);
        }
        if (parsedData.shift) {
          form.setValue('shift', parsedData.shift === 'none' ? 'none' : parsedData.shift);
        }
      } catch (e) {
        // If not JSON, treat as student ID
        form.setValue('studentId', initialData);
      }
    }
  }, [initialData, form]);

  const getDepartmentOptions = () => {
    if (watchedLevel === 'college') {
      return [
        { value: 'none', label: 'No department assigned' },
        { value: 'CECE', label: 'CECE (Civil Engineering & Computer Engineering)' },
        { value: 'CTELAN', label: 'CTELAN (Teacher Education & Liberal Arts)' },
        { value: 'CBA', label: 'CBA (College of Business Administration)' }
      ];
    } else if (watchedLevel === 'senior-high') {
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

  const onSubmit = async (data: RegistrationForm) => {
    console.log('Form submission data:', data);

    // Validation rules
    const nameValid = !!data.name && data.name.trim().split(/\s+/).length >= 2;
    const emailValid = !data.email || /^[A-Za-z0-9._%+-]+@(gmail\.com|ndkc\.edu\.ph)$/.test(data.email);
    const studentIdValid = /^\d{4}-\d{3,4}$/.test(data.studentId || '');
    const courseValid = !!data.course?.trim();
    const yearValid = !!data.year?.trim();

    if (!nameValid) {
      form.setError('name', { type: 'manual', message: 'Please enter first and last name.' });
      toast({ title: 'Invalid Name', description: 'Enter at least first and last name.', variant: 'destructive' });
      return;
    }
    if (!studentIdValid) {
      form.setError('studentId', { type: 'manual', message: 'Format: YYYY-XXX or YYYY-XXXX (e.g., 2021-033).' });
      toast({ title: 'Invalid Student ID', description: 'Use format YYYY-XXX or YYYY-XXXX.', variant: 'destructive' });
      return;
    }
    if (!emailValid) {
      form.setError('email', { type: 'manual', message: 'Email must be gmail.com or ndkc.edu.ph.' });
      toast({ title: 'Invalid Email Domain', description: 'Use gmail.com or ndkc.edu.ph.', variant: 'destructive' });
      return;
    }
    if (!courseValid) {
      form.setError('course', { type: 'manual', message: 'Course is required.' });
      toast({ title: 'Course Required', description: 'Please enter course.', variant: 'destructive' });
      return;
    }
    if (!yearValid) {
      form.setError('year', { type: 'manual', message: 'Year is required.' });
      toast({ title: 'Year Required', description: 'Please enter year.', variant: 'destructive' });
      return;
    }

    const studentData: Omit<Student, 'id'> = {
      name: data.name,
      studentId: data.studentId,
      email: data.email,
      department: data.department === 'none' ? undefined : data.department,
      level: data.level === 'none' ? undefined : data.level as 'elementary' | 'junior-high' | 'senior-high' | 'college',
      shift: (data.level === 'senior-high' && data.shift !== 'none') ? data.shift as 'morning' | 'afternoon' : undefined,
      course: data.course,
      year: data.year,
      contactNumber: data.contactNumber,
      profilePicture: profilePicture || undefined,
      rfid: rfidData || undefined
    };

    try {
      const newStudent = await studentService.addStudent(studentData);
      console.log('Created student:', newStudent);
      
      toast({
        title: "Student Registered",
        description: `${newStudent.name} has been registered successfully`,
        duration: 3000,
      });
      
      onStudentRegistered(newStudent);
      onClose();
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to register student. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Register New Student
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <OfflineIndicator />
          
          {/* Profile Picture Upload */}
          <div>
            <Label className="text-base font-medium">Profile Picture</Label>
            <div className="mt-2">
              <ImageUpload
                currentImage={profilePicture || undefined}
                onImageChange={setProfilePicture}
              />
            </div>
          </div>

          {/* RFID Scanner */}
          <div>
            <RFIDScanner
              onRFIDDetected={setRfidData}
              isActive={true}
              currentRFID={rfidData}
            />
          </div>

          {/* Registration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} required pattern="^[^\\s]+\\s+[^\\s]+.*$" title="Enter at least first and last name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter student ID (e.g., 2021-033)" {...field} required pattern="^\\d{4}-\\d{3,4}$" title="Format: YYYY-XXX or YYYY-XXXX (e.g., 2021-033)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value || 'none'} 
                          onValueChange={(value) => {
                            console.log('Level changed to:', value);
                            field.onChange(value);
                            // Reset department when level changes
                            form.setValue('department', 'none');
                            // Reset shift when level changes
                            form.setValue('shift', 'none');
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedLevel === 'senior-high' ? 'Strand' : 'Department'}
                      </FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value || 'none'} 
                          onValueChange={(value) => {
                            console.log('Department changed to:', value);
                            field.onChange(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${watchedLevel === 'senior-high' ? 'strand' : 'department'}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {getDepartmentOptions().map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show shift field only for SHS students */}
                {watchedLevel === 'senior-high' && (
                  <FormField
                    control={form.control}
                    name="shift"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value || 'none'} 
                            onValueChange={(value) => {
                              console.log('Shift changed to:', value);
                              field.onChange(value);
                            }}
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

<FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter course" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter year (e.g., 1st Year or Grade 11)" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email (gmail.com or ndkc.edu.ph)" {...field} pattern="^[A-Za-z0-9._%+-]+@(gmail\\.com|ndkc\\.edu\\.ph)$" title="Use gmail.com or ndkc.edu.ph email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Register Student
                </Button>
                </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentRegistration;
