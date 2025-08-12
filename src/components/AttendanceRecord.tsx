
import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, User, Barcode, Fingerprint, UserCheck, Calendar, LogIn, LogOut } from 'lucide-react';
import { AttendanceEntry } from '@/types/AttendanceEntry';
import { startOfDay, startOfWeek, startOfMonth, isAfter, isSameDay } from 'date-fns';

interface AttendanceRecordProps {
  records: AttendanceEntry[];
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

const AttendanceRecord: React.FC<AttendanceRecordProps> = ({ records }) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredRecords = useMemo(() => {
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return records.filter(record => isSameDay(record.timestamp, now));
      case 'week':
        const weekStart = startOfWeek(now);
        return records.filter(record => isAfter(record.timestamp, weekStart) || isSameDay(record.timestamp, weekStart));
      case 'month':
        const monthStart = startOfMonth(now);
        return records.filter(record => isAfter(record.timestamp, monthStart) || isSameDay(record.timestamp, monthStart));
      case 'all':
      default:
        return records;
    }
  }, [records, dateFilter]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'barcode':
        return <Barcode className="h-3 w-3" />;
      case 'biometric':
        return <Fingerprint className="h-3 w-3" />;
      case 'manual':
        return <UserCheck className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'barcode':
        return 'bg-blue-100 text-blue-800';
      case 'biometric':
        return 'bg-green-100 text-green-800';
      case 'manual':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'check-in' ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'check-in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      {/* Date Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by date:</span>
        </div>
        <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Records Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRecords.length} of {records.length} records
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No attendance records found for the selected period</p>
          <p className="text-sm">Try selecting a different time period or start recording attendance</p>
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {record.studentName}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {record.barcode && (
                        <>
                          <Barcode className="h-3 w-3" />
                          <span>{record.barcode}</span>
                        </>
                      )}
                      {record.purpose && (
                        <span className="text-xs">• {record.purpose}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getTypeColor(record.type)}`}>
                      {getTypeIcon(record.type)}
                      <span className="capitalize">{record.type}</span>
                    </div>
                    <Badge 
                      variant={record.studentId === 'Unknown' ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {record.studentId === 'Unknown' ? 'Unknown' : record.studentId === 'VISITOR' ? 'Visitor' : 'Student'}
                    </Badge>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getMethodColor(record.method)}`}>
                      {getMethodIcon(record.method)}
                      <span className="capitalize">{record.method}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(record.timestamp)}</span>
                    <span>•</span>
                    <span>{formatDate(record.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AttendanceRecord;
