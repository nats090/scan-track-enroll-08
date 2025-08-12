
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';

interface DataOverviewProps {
  students: Student[];
  regularAttendance: AttendanceEntry[];
  visitors: AttendanceEntry[];
}

const DataOverview = ({ students, regularAttendance, visitors }: DataOverviewProps) => {
  return (
    <Tabs defaultValue="attendance" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="attendance">Attendance ({regularAttendance.length})</TabsTrigger>
        <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
        <TabsTrigger value="visitors">Visitors ({visitors.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="attendance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularAttendance.slice(0, 50).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.studentName}</TableCell>
                      <TableCell>{record.studentId}</TableCell>
                      <TableCell>{format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell className="capitalize">{record.method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {regularAttendance.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Showing first 50 records. Use export to get all data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="students" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registered Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Last Scan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.slice(0, 50).map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.department || 'N/A'}</TableCell>
                      <TableCell>{student.email || 'N/A'}</TableCell>
                      <TableCell>
                        {student.lastScan ? format(new Date(student.lastScan), 'MMM dd, yyyy HH:mm') : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {students.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Showing first 50 records. Use export to get all data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="visitors" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Visitor Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitors.slice(0, 50).map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell>{visitor.studentName}</TableCell>
                      <TableCell>{visitor.purpose || 'N/A'}</TableCell>
                      <TableCell>{visitor.contact || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(visitor.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {visitors.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Showing first 50 records. Use export to get all data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default DataOverview;
