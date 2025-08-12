
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface BiometricScannerProps {
  onBiometricDetected: (biometricData: string) => void;
  isActive: boolean;
}

const BiometricScanner: React.FC<BiometricScannerProps> = ({ onBiometricDetected, isActive }) => {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Biometric Scanner Disabled
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Biometric functionality has been disabled in this system.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default BiometricScanner;
