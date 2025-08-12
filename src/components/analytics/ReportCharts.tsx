import React from 'react';
import { AttendanceEntry } from '@/types/AttendanceEntry';
import { Student } from '@/types/Student';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// Helper to build daily counts from records
function buildDailyCounts(records: AttendanceEntry[]) {
  const byDate: Record<string, number> = {};
  records.forEach(r => {
    const d = new Date(r.timestamp);
    const key = format(d, 'yyyy-MM-dd');
    byDate[key] = (byDate[key] || 0) + 1;
  });
  return Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

// Helper to build course distribution
function buildCourseDistribution(records: AttendanceEntry[], students: Student[]) {
  const studentMap = new Map(students.map(s => [s.studentId, s] as const));
  const byCourse: Record<string, number> = {};
  records.forEach(r => {
    const s = studentMap.get(r.studentId);
    const course = (s?.course || s?.department || 'Unknown').trim() || 'Unknown';
    byCourse[course] = (byCourse[course] || 0) + 1;
  });
  return Object.entries(byCourse)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#A855F7'];

export function ChartTimeSeries({ attendanceRecords }: { attendanceRecords: AttendanceEntry[] }) {
  const data = React.useMemo(() => buildDailyCounts(attendanceRecords), [attendanceRecords]);
  return (
    <ChartContainer config={{ count: { label: 'Daily Records', color: 'hsl(var(--primary))' } }}>
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function ChartCourseDistribution({ attendanceRecords, students }: { attendanceRecords: AttendanceEntry[]; students: Student[] }) {
  const data = React.useMemo(() => buildCourseDistribution(attendanceRecords, students), [attendanceRecords, students]);
  return (
    <ChartContainer config={{ value: { label: 'Count', color: 'hsl(var(--primary))' } }}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
      </PieChart>
    </ChartContainer>
  );
}
