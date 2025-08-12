import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Download, Upload, RefreshCw } from 'lucide-react';
import { supabaseService } from '@/services/supabaseService';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';

interface SyncControlsProps {
  onDataSynced: (students: Student[], attendanceRecords: AttendanceEntry[]) => void;
}

const SyncControls: React.FC<SyncControlsProps> = ({ onDataSynced }) => {
  const [syncing, setSyncing] = useState(false);

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    try {
      const result = await supabaseService.syncLocalToSupabase();
      
      toast({
        title: "Sync Complete",
        description: `Uploaded ${result.studentsAdded} students and ${result.recordsAdded} attendance records to Supabase`,
      });

      // Refresh data from Supabase to get the latest state
      const refreshedData = await supabaseService.syncSupabaseToLocal();
      onDataSynced(refreshedData.students, refreshedData.attendanceRecords);
      
    } catch (error) {
      console.error('Sync to Supabase failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to upload data to Supabase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFromSupabase = async () => {
    setSyncing(true);
    try {
      const result = await supabaseService.syncSupabaseToLocal();
      onDataSynced(result.students, result.attendanceRecords);
      
      toast({
        title: "Sync Complete",
        description: `Downloaded ${result.students.length} students and ${result.attendanceRecords.length} attendance records from Supabase`,
      });
    } catch (error) {
      console.error('Sync from Supabase failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to download data from Supabase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Data Synchronization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleSyncToSupabase}
            disabled={syncing}
            variant="outline"
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {syncing ? 'Syncing...' : 'Upload to Supabase'}
          </Button>
          
          <Button
            onClick={handleSyncFromSupabase}
            disabled={syncing}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {syncing ? 'Syncing...' : 'Download from Supabase'}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          Use these buttons to manually sync data between local storage and Supabase database
        </p>
      </CardContent>
    </Card>
  );
};

export default SyncControls;
