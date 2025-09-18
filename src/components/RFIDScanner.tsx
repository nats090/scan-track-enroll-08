import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ContactRound, Wifi, WifiOff, Check, X, Zap, Shield, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { attendanceService } from '@/services/attendanceService';
import { studentService } from '@/services/studentService';
import { getFromLocalStorage } from '@/utils/offlineStorage';

// Web Serial API type definitions
interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

interface SerialPort {
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
}

interface SerialPortRequestOptions {
  filters?: Array<{
    usbVendorId?: number;
    usbProductId?: number;
  }>;
}

interface Serial {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}

declare global {
  interface Navigator {
    serial: Serial;
  }
}

interface RFIDScannerProps {
  onRFIDDetected?: (rfidData: string) => void;
  isActive: boolean;
  currentRFID?: string;
  mode?: 'check-in' | 'check-out' | 'register' | 'general';
  onCheckIn?: (studentData: any) => void;
  onCheckOut?: (studentData: any) => void;
  onRegister?: (rfidData: string) => void;
}

const RFIDScanner: React.FC<RFIDScannerProps> = ({ 
  onRFIDDetected, 
  isActive, 
  currentRFID,
  mode = 'general',
  onCheckIn,
  onCheckOut,
  onRegister
}) => {
  const [manualRFID, setManualRFID] = useState(currentRFID || '');
  const [isScanning, setIsScanning] = useState(false);
  const [rfidReaderStatus, setRfidReaderStatus] = useState<'ready' | 'scanning' | 'error' | 'offline'>('offline');
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null);
  const [reader, setReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Initialize RFID reader connection
  useEffect(() => {
    if (isActive) {
      initializeRFIDReader();
    } else {
      disconnectRFIDReader();
    }
    
    return () => {
      disconnectRFIDReader();
    };
  }, [isActive]);

  const initializeRFIDReader = async () => {
    try {
      if (!('serial' in navigator)) {
        setRfidReaderStatus('error');
        toast({
          title: "RFID Reader Error",
          description: "Web Serial API not supported. Use Chrome/Edge browser.",
          variant: "destructive",
        });
        return;
      }

      setRfidReaderStatus('ready');
      toast({
        title: "RFID Reader Ready",
        description: "Click 'Connect Reader' to connect your RFID device.",
      });
    } catch (error) {
      setRfidReaderStatus('error');
      toast({
        title: "RFID Reader Error",
        description: "Failed to initialize RFID reader",
        variant: "destructive",
      });
    }
  };

  const connectRFIDReader = async () => {
    try {
      const port = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x1FC9 }, // NXP (common RFID manufacturer)
          { usbVendorId: 0x072F }, // Advanced Card Systems
          { usbVendorId: 0x0BDA }, // Realtek (some RFID readers)
        ]
      });

      await port.open({ 
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: 'none'
      });

      setSerialPort(port);
      setRfidReaderStatus('scanning');
      
      // Start reading from the RFID reader
      const reader = port.readable.getReader();
      setReader(reader);
      startReading(reader);

      toast({
        title: "RFID Reader Connected",
        description: "Place an RFID card near the reader to scan.",
      });
    } catch (error) {
      setRfidReaderStatus('error');
      toast({
        title: "Connection Failed",
        description: "Failed to connect to RFID reader. Check device connection.",
        variant: "destructive",
      });
    }
  };

  const startReading = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
    if (value) {
      const data = new TextDecoder().decode(value);
      await processRFIDData(data);
    }
      }
    } catch (error) {
      console.error('Error reading from RFID device:', error);
      setRfidReaderStatus('error');
    }
  };

  const findStudent = async (searchId: string) => {
    // First check local storage
    const localData = await getFromLocalStorage();
    const localStudent = localData.students.find(s =>
      s.studentId === searchId || s.id === searchId || s.rfid === searchId
    );
    
    if (localStudent) {
      return localStudent;
    }

    // Try online lookup if available
    try {
      if (navigator.onLine) {
        // Try finding by RFID
        const student = await studentService.findStudentByRFID(searchId);
        return student;
      }
    } catch (error) {
      console.log('Online lookup failed, using local data only');
    }
    
    return null;
  };

  const processRFIDData = async (data: string) => {
    // Process incoming RFID data (format varies by reader manufacturer)
    const cleanData = data.trim().replace(/[\r\n]/g, '');
    
    if (cleanData.length >= 8) { // Valid RFID UID typically 8+ characters
      const timestamp = Date.now();
      const rfidData = `RFID:${cleanData.toUpperCase()}:${timestamp}`;
      
      setManualRFID(rfidData);
      setLastScanTime(new Date());

      // Handle different modes
      if (mode === 'check-in' && onCheckIn) {
        await handleCheckIn(cleanData.toUpperCase());
      } else if (mode === 'check-out' && onCheckOut) {
        await handleCheckOut(cleanData.toUpperCase());
      } else if (mode === 'register' && onRegister) {
        onRegister(rfidData);
        toast({
          title: "RFID Card Read Successfully",
          description: `Card UID: ${cleanData.toUpperCase()}`,
          duration: 3000,
        });
      } else if (onRFIDDetected) {
        onRFIDDetected(rfidData);
        toast({
          title: "RFID Card Read Successfully",
          description: `Card UID: ${cleanData.toUpperCase()}`,
          duration: 3000,
        });
      }
    }
  };

  const handleCheckIn = async (rfidUID: string) => {
    try {
      const student = await findStudent(rfidUID);
      
      if (student) {
        // Check current status before allowing check-in
        const currentStatus = await attendanceService.getStudentCurrentStatus(student.studentId);
        
        if (currentStatus === 'checked-in') {
          toast({
            title: "Already Checked In",
            description: `${student.name} is already checked in. Please check out first.`,
            variant: "destructive",
          });
          return;
        }

        const newRecord = {
          studentId: student.studentId,
          studentName: student.name,
          timestamp: new Date(),
          type: 'check-in' as const,
          method: 'rfid' as const
        };
        
        await attendanceService.addAttendanceRecord(newRecord);
        
        toast({
          title: "Welcome!",
          description: `${student.name} checked in successfully via RFID`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Student Not Found",
          description: "RFID card not registered. Please register first or use manual entry.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong during check-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async (rfidUID: string) => {
    try {
      const student = await findStudent(rfidUID);
      
      if (student) {
        // Check current status before allowing check-out
        const currentStatus = await attendanceService.getStudentCurrentStatus(student.studentId);
        
        if (currentStatus === 'checked-out') {
          toast({
            title: "Already Checked Out",
            description: `${student.name} is not currently checked in.`,
            variant: "destructive",
          });
          return;
        }
        
        if (currentStatus === 'unknown') {
          toast({
            title: "No Check-in Record",
            description: `${student.name} has no active check-in record.`,
            variant: "destructive",
          });
          return;
        }

        const newRecord = {
          studentId: student.studentId,
          studentName: student.name,
          timestamp: new Date(),
          type: 'check-out' as const,
          method: 'rfid' as const
        };
        
        await attendanceService.addAttendanceRecord(newRecord);
        
        toast({
          title: "Goodbye!",
          description: `${student.name} checked out successfully via RFID`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Student Not Found",
          description: "RFID card not registered. Please register first or use manual entry.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong during check-out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnectRFIDReader = async () => {
    try {
      if (reader) {
        await reader.cancel();
        setReader(null);
      }
      if (serialPort) {
        await serialPort.close();
        setSerialPort(null);
      }
      setRfidReaderStatus('offline');
    } catch (error) {
      console.error('Error disconnecting RFID reader:', error);
    }
  };

  // Manual scan trigger for testing/demo purposes
  const startManualScan = useCallback(() => {
    if (!isActive) return;
    
    if (!serialPort) {
      toast({
        title: "No RFID Reader Connected",
        description: "Please connect an RFID reader first.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "RFID Reader Active",
      description: "Place your RFID card near the reader...",
      duration: 3000,
    });
  }, [isActive, serialPort]);

  const handleManualInput = async () => {
    if (manualRFID.trim()) {
      // Validate RFID format
      const rfidPattern = /^[A-Fa-f0-9]{8,16}$/;
      const cleanRFID = manualRFID.replace(/[^A-Fa-f0-9]/g, '');
      
      if (rfidPattern.test(cleanRFID)) {
        const formattedRFID = `RFID:${cleanRFID.toUpperCase()}:${Date.now()}`;
        setLastScanTime(new Date());

        // Handle different modes for manual input too
        if (mode === 'check-in' && onCheckIn) {
          await handleCheckIn(cleanRFID.toUpperCase());
        } else if (mode === 'check-out' && onCheckOut) {
          await handleCheckOut(cleanRFID.toUpperCase());
        } else if (mode === 'register' && onRegister) {
          onRegister(formattedRFID);
          toast({
            title: "RFID Set Successfully",
            description: `Card UID: ${cleanRFID.toUpperCase()}`,
          });
        } else if (onRFIDDetected) {
          onRFIDDetected(formattedRFID);
          toast({
            title: "RFID Set Successfully",
            description: `Card UID: ${cleanRFID.toUpperCase()}`,
          });
        }
      } else {
        toast({
          title: "Invalid RFID Format",
          description: "Please enter a valid hexadecimal RFID UID (8-16 characters)",
          variant: "destructive",
        });
      }
    }
  };

  const clearRFID = () => {
    setManualRFID('');
    if (onRFIDDetected) onRFIDDetected('');
    setLastScanTime(null);
  };

  const getStatusColor = () => {
    switch (rfidReaderStatus) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'scanning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (rfidReaderStatus) {
      case 'ready': return <Shield className="h-4 w-4" />;
      case 'scanning': return <Zap className="h-4 w-4 animate-pulse" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ContactRound className="h-5 w-5" />
          RFID Scanner ({mode.charAt(0).toUpperCase() + mode.slice(1)} Mode)
          <Badge variant="outline" className={`ml-auto ${getStatusColor()}`}>
            {getStatusIcon()}
            {rfidReaderStatus.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive ? (
          <>
            {/* RFID Reader Status */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Wifi className={`h-4 w-4 ${serialPort ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">
                  Reader: {serialPort ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  rfidReaderStatus === 'scanning' ? 'bg-blue-500 animate-pulse' : 
                  serialPort ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {serialPort ? '13.56MHz Active' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Connection Controls */}
            {!serialPort ? (
              <Button
                onClick={connectRFIDReader}
                className="w-full mb-4"
                variant="default"
              >
                <Wifi className="mr-2 h-4 w-4" />
                Connect RFID Reader
              </Button>
            ) : (
              <Button
                onClick={disconnectRFIDReader}
                className="w-full mb-4"
                variant="outline"
              >
                <X className="mr-2 h-4 w-4" />
                Disconnect Reader
              </Button>
            )}

            {/* Scanning Area */}
            <div className={`p-6 border-2 border-dashed rounded-lg text-center transition-all ${
              rfidReaderStatus === 'scanning' ? 'border-blue-500 bg-blue-50' : 
              serialPort ? 'border-green-500 bg-green-50' : 
              'border-gray-300 bg-gray-50'
            }`}>
              <ContactRound size={48} className={`mx-auto mb-3 ${
                rfidReaderStatus === 'scanning' ? 'text-blue-600 animate-pulse' : 
                serialPort ? 'text-green-600' : 
                'text-gray-400'
              }`} />
              <h3 className="text-lg font-semibold mb-2">
                {rfidReaderStatus === 'scanning' ? 'Scanning for Cards...' : 
                 serialPort ? 'RFID Reader Active' : 
                 'Connect RFID Reader'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {rfidReaderStatus === 'scanning' ? 'Place RFID card near reader and hold steady...' :
                 serialPort ? 'Reader is connected and waiting for RFID cards' :
                 'Connect your RFID reader to start scanning cards'}
              </p>
              
              {serialPort && (
                <>
                  <Button
                    onClick={startManualScan}
                    disabled={!serialPort}
                    variant={currentRFID ? "secondary" : "default"}
                    className="mb-3"
                  >
                    {currentRFID ? (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Scan Another Card
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ContactRound className="h-4 w-4" />
                        Ready to Scan
                      </div>
                    )}
                  </Button>
                  
                  {lastScanTime && (
                    <p className="text-xs text-muted-foreground">
                      Last scan: {lastScanTime.toLocaleTimeString()}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Manual Input Section */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
              <Label htmlFor="manual-rfid" className="text-sm font-medium">
                Manual RFID UID Entry (Advanced)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="manual-rfid"
                  value={manualRFID}
                  onChange={(e) => setManualRFID(e.target.value.toUpperCase())}
                  placeholder="Enter hex UID (e.g., 045A2E92)"
                  className="font-mono text-sm"
                  maxLength={16}
                />
                <Button onClick={handleManualInput} variant="outline" size="sm">
                  Set
                </Button>
                {currentRFID && (
                  <Button onClick={clearRFID} variant="outline" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Enter 8-16 character hexadecimal UID (A-F, 0-9)
              </p>
            </div>

            {/* Current RFID Display */}
            {currentRFID && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-800 mb-1">
                      RFID Card Configured
                    </h4>
                    <code className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded font-mono break-all">
                      {currentRFID}
                    </code>
                    <p className="text-xs text-green-600 mt-2">
                      This student can now use RFID for check-in/check-out
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center space-y-3 py-8">
            <WifiOff className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="text-lg font-medium text-gray-600">RFID Scanner Offline</h3>
            <p className="text-sm text-muted-foreground">
              Activate the scanner to begin reading RFID cards
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RFIDScanner;