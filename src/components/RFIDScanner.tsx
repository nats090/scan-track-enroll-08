import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ContactRound, Wifi, WifiOff, Check, X, Zap, Shield, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  onRFIDDetected: (rfidData: string) => void;
  isActive: boolean;
  currentRFID?: string;
}

const RFIDScanner: React.FC<RFIDScannerProps> = ({ 
  onRFIDDetected, 
  isActive, 
  currentRFID 
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
          processRFIDData(data);
        }
      }
    } catch (error) {
      console.error('Error reading from RFID device:', error);
      setRfidReaderStatus('error');
    }
  };

  const processRFIDData = (data: string) => {
    // Process incoming RFID data (format varies by reader manufacturer)
    const cleanData = data.trim().replace(/[\r\n]/g, '');
    
    if (cleanData.length >= 8) { // Valid RFID UID typically 8+ characters
      const timestamp = Date.now();
      const rfidData = `RFID:${cleanData.toUpperCase()}:${timestamp}`;
      
      setManualRFID(rfidData);
      onRFIDDetected(rfidData);
      setLastScanTime(new Date());
      
      toast({
        title: "RFID Card Read Successfully",
        description: `Card UID: ${cleanData.toUpperCase()}`,
        duration: 3000,
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

  const handleManualInput = () => {
    if (manualRFID.trim()) {
      // Validate RFID format
      const rfidPattern = /^[A-Fa-f0-9]{8,16}$/;
      const cleanRFID = manualRFID.replace(/[^A-Fa-f0-9]/g, '');
      
      if (rfidPattern.test(cleanRFID)) {
        const formattedRFID = `RFID:${cleanRFID.toUpperCase()}:${Date.now()}`;
        onRFIDDetected(formattedRFID);
        setLastScanTime(new Date());
        toast({
          title: "RFID Set Successfully",
          description: `Card UID: ${cleanRFID.toUpperCase()}`,
        });
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
    onRFIDDetected('');
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
          Professional RFID Scanner
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