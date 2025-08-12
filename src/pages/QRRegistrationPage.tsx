
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCodeRegistration from '@/components/QRCodeRegistration';
import StudentRegistration from '@/components/StudentRegistration';
import { Student } from '@/types/Student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface QRRegistrationPageProps {
  onStudentRegistered: (student: Student) => void;
  students: Student[];
}

const QRRegistrationPage = ({ onStudentRegistered, students }: QRRegistrationPageProps) => {
  const [searchParams] = useSearchParams();
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState<string>('');
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    // Check if this is a QR code scan with registration data
    const register = searchParams.get('register');
    const data = searchParams.get('data');
    
    if (register === 'true' && data) {
      setRegistrationData(decodeURIComponent(data));
      setShowRegistration(true);
    }
  }, [searchParams]);

  const handleStudentRegistered = (student: Student) => {
    onStudentRegistered(student);
    setRegistrationComplete(true);
    setShowRegistration(false);
  };

  const handleCloseRegistration = () => {
    setShowRegistration(false);
    setRegistrationData('');
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Registration Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Your registration has been successfully submitted. You can now close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showRegistration) {
    return (
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Complete Your Registration</h1>
            <p className="text-muted-foreground">
              Please review and complete your student registration
            </p>
          </div>
          <StudentRegistration
            onStudentRegistered={handleStudentRegistered}
            onClose={handleCloseRegistration}
            initialData={registrationData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">QR Code Registration</h2>
        <p className="text-muted-foreground text-lg">
          Generate QR codes for students to register on their mobile devices
        </p>
      </div>
      <QRCodeRegistration 
        onStudentRegistered={onStudentRegistered}
        students={students}
      />
    </div>
  );
};

export default QRRegistrationPage;
