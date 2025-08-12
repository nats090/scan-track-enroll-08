
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <Alert className={`mb-4 ${isOnline ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
      <div className="flex items-center">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600 mr-2" />
        ) : (
          <WifiOff className="h-4 w-4 text-orange-600 mr-2" />
        )}
        <AlertDescription className={isOnline ? 'text-green-800' : 'text-orange-800'}>
          {isOnline 
            ? 'Connected - Data will sync automatically' 
            : 'Offline mode - Changes saved locally'
          }
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default OfflineIndicator;
