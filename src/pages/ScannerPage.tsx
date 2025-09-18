
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BarcodeScanner from '@/components/BarcodeScanner';
import StudentRegistration from '@/components/StudentRegistration';
import VisitorEntry from '@/components/VisitorEntry';
import { Barcode, UserPlus, User, ContactRound } from 'lucide-react';
import { Student } from '@/types/Student';
import RFIDScanner from '@/components/RFIDScanner';

interface ScannerPageProps {
  onBarcodeDetected: (barcode: string) => void;
  onBiometricDetected: (biometricData: string) => void;
  onRFIDDetected: (rfidData: string) => void;
  onStudentRegistered: (student: Student) => void;
  onVisitorEntry: (visitorData: { name: string; purpose: string; contact: string }) => void;
}

const ScannerPage = ({ 
  onBarcodeDetected, 
  onBiometricDetected, 
  onRFIDDetected,
  onStudentRegistered, 
  onVisitorEntry 
}: ScannerPageProps) => {
  const [activeScanner, setActiveScanner] = useState<'none' | 'barcode' | 'rfid'>('none');
  const [showRegistration, setShowRegistration] = useState(false);
  const [showVisitorEntry, setShowVisitorEntry] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Scanner & Registration</h2>
        <p className="text-muted-foreground text-lg">
          Scan barcodes or manually register students and visitors
        </p>
      </div>

      <Card className="shadow-lg border-0 bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quick Access Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="barcode" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="barcode">Barcode</TabsTrigger>
              <TabsTrigger value="rfid">RFID</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            
            <TabsContent value="barcode" className="space-y-4">
              <div className="text-center space-y-4">
                <Button
                  onClick={() => setActiveScanner(activeScanner === 'barcode' ? 'none' : 'barcode')}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Barcode className="h-5 w-5 mr-2" />
                  {activeScanner === 'barcode' ? 'Stop Barcode Scanning' : 'Start Barcode Scanning'}
                </Button>
                
                {activeScanner === 'barcode' && (
                  <div className="flex justify-center">
                    <BarcodeScanner
                      onBarcodeDetected={onBarcodeDetected}
                      isActive={activeScanner === 'barcode'}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rfid" className="space-y-4">
              <div className="text-center space-y-4">
                <Button
                  onClick={() => setActiveScanner(activeScanner === 'rfid' ? 'none' : 'rfid')}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <ContactRound className="h-5 w-5 mr-2" />
                  {activeScanner === 'rfid' ? 'Stop RFID Scanning' : 'Start RFID Scanning'}
                </Button>
                
                {activeScanner === 'rfid' && (
                  <div className="flex justify-center">
                    <RFIDScanner
                      onRFIDDetected={onRFIDDetected}
                      isActive={activeScanner === 'rfid'}
                      mode="register"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button
                    onClick={() => setShowRegistration(true)}
                    size="lg"
                    variant="outline"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Register Student
                  </Button>
                  
                  <Button
                    onClick={() => setShowVisitorEntry(true)}
                    size="lg"
                    variant="outline"
                  >
                    <User className="h-5 w-5 mr-2" />
                    Visitor Entry
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Registration Dialog */}
      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Registration</DialogTitle>
          </DialogHeader>
          <StudentRegistration
            onStudentRegistered={onStudentRegistered}
            onClose={() => setShowRegistration(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Visitor Entry Dialog */}
      <Dialog open={showVisitorEntry} onOpenChange={setShowVisitorEntry}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Visitor Entry</DialogTitle>
          </DialogHeader>
          <VisitorEntry
            onVisitorEntry={onVisitorEntry}
            onClose={() => setShowVisitorEntry(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScannerPage;
