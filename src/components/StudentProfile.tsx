
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Student } from '@/types/Student';
import { Edit, Save, X, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ImageUpload from './ImageUpload';

interface StudentProfileProps {
  student: Student;
  onUpdateStudent: (student: Student) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface ProfileForm {
  name: string;
  studentId: string;
  email: string;
  department: string;
  level: string;
}

const StudentProfile = ({ student, onUpdateStudent, onClose, isOpen }: StudentProfileProps) => {
  const [profilePicture, setProfilePicture] = useState<string | null>(student.profilePicture || null);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileForm>({
    defaultValues: {
      name: student.name,
      studentId: student.studentId,
      email: student.email || '',
      department: student.department || '',
      level: student.level || ''
    }
  });

  const onSubmit = (data: ProfileForm) => {
    const updatedStudent: Student = {
      ...student,
      name: data.name,
      studentId: data.studentId,
      email: data.email,
      department: data.department,
      level: data.level ? data.level as 'elementary' | 'junior-high' | 'senior-high' | 'college' : undefined,
      profilePicture: profilePicture || undefined
    };

    onUpdateStudent(updatedStudent);
    setIsEditing(false);
    
    toast({
      title: "Profile Updated",
      description: "Student profile has been updated successfully",
    });
  };

  const handleClose = () => {
    setIsEditing(false);
    form.reset();
    setProfilePicture(student.profilePicture || null);
    onClose();
  };

  const levelLabels = {
    elementary: 'Elementary',
    'junior-high': 'Junior High',
    'senior-high': 'Senior High',
    college: 'College'
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                currentImage={profilePicture || undefined}
                onImageChange={setProfilePicture}
              />
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Profile Information
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
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
                              <Input placeholder="Enter full name" {...field} required />
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
                              <Input placeholder="Enter student ID" {...field} required />
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
                              <Select value={field.value} onValueChange={field.onChange}>
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
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No department assigned</SelectItem>
                                  <SelectItem value="CECE">CECE</SelectItem>
                                  <SelectItem value="CBA">CBA</SelectItem>
                                  <SelectItem value="CTELAN">CTELAN</SelectItem>
                                </SelectContent>
                              </Select>
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
                              <Input type="email" placeholder="Enter email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                      <p className="text-sm mt-1">{student.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Student ID</Label>
                      <p className="text-sm mt-1">{student.studentId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Level</Label>
                      <p className="text-sm mt-1">
                        {student.level ? levelLabels[student.level as keyof typeof levelLabels] : 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                      <p className="text-sm mt-1">{student.department || 'Not assigned'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-sm mt-1">{student.email || 'Not provided'}</p>
                    </div>
                    {student.lastScan && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-muted-foreground">Last Scan</Label>
                        <p className="text-sm mt-1">{student.lastScan.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProfile;
