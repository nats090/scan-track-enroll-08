
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface BiometricEnrollmentProps {
  onBiometricEnrolled: (data: string) => void;
  onCancel: () => void;
}

const BiometricEnrollment: React.FC<BiometricEnrollmentProps> = ({ onBiometricEnrolled, onCancel }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-5 w-5" />
          Biometric Enrollment Disabled
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Biometric enrollment has been disabled in this system.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default BiometricEnrollment;
