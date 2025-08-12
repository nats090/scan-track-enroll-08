
import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  isActive: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBarcodeDetected, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!isActive) {
      stopScanning();
      return;
    }

    startScanning();
    return () => stopScanning();
  }, [isActive]);

  const startScanning = async () => {
    try {
      setError('');
      setIsLoading(true);
      
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      const reader = readerRef.current;
      
      // Get video devices
      const videoInputDevices = await reader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Use the first available camera (or back camera if available)
      const selectedDeviceId = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      )?.deviceId || videoInputDevices[0].deviceId;

      console.log('Starting barcode scanning with device:', selectedDeviceId);

      // Start decoding from video element
      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            console.log('Barcode detected:', result.getText());
            onBarcodeDetected(result.getText());
          }
          if (error && !(error.name === 'NotFoundException')) {
            console.error('Scanning error:', error);
          }
        }
      );

      setIsLoading(false);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setIsLoading(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsLoading(false);
  };

  if (error) {
    return (
      <Alert className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Camera Error: {error}
          <br />
          <span className="text-sm text-muted-foreground mt-2 block">
            Please ensure camera permissions are granted and try again.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-4 max-w-md">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-64 bg-muted rounded-lg object-cover"
          playsInline
          muted
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-lg">
            <div className="text-center">
              <Camera className="h-8 w-8 animate-pulse mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Starting camera...</p>
            </div>
          </div>
        )}
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-primary rounded-lg opacity-50">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground text-center mt-2">
        Position barcode within the frame to scan
      </p>
    </Card>
  );
};

export default BarcodeScanner;
