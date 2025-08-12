
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Student } from '@/types/Student';
import { AttendanceEntry } from '@/types/AttendanceEntry';
import { Users, Clock, UserCheck, TrendingUp, Calendar, Activity, RefreshCw } from 'lucide-react';
import { usePeriodicRefresh } from '@/hooks/usePeriodicRefresh';

interface DashboardProps {
  students: Student[];
  attendanceRecords: AttendanceEntry[];
}

const Dashboard = ({ students, attendanceRecords }: DashboardProps) => {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate data based on current timestamp to ensure fresh calculations
  const calculateDashboardData = useCallback(() => {
    const now = new Date();
    const totalStudents = students.length;
    const totalAttendance = attendanceRecords.length;
    
    // Get today's attendance
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayAttendance = attendanceRecords.filter(record => 
      record.timestamp >= todayStart
    ).length;

    // Get unique students who attended today
    const uniqueStudentsToday = new Set(
      attendanceRecords
        .filter(record => record.timestamp >= todayStart && record.studentId !== 'VISITOR')
        .map(record => record.studentId)
    ).size;

    // Get recent activity (last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyAttendance = attendanceRecords.filter(record => 
      record.timestamp >= weekAgo
    ).length;

    // Get most active students (this week)
    const studentActivity = students.map(student => {
      const attendanceCount = attendanceRecords.filter(record => 
        record.studentId === student.studentId && record.timestamp >= weekAgo
      ).length;
      return { ...student, weeklyVisits: attendanceCount };
    }).sort((a, b) => b.weeklyVisits - a.weeklyVisits).slice(0, 5);

    // Calculate peak hour for today
    const hourCounts = attendanceRecords
      .filter(record => record.timestamp >= todayStart)
      .reduce((acc, record) => {
        const hour = record.timestamp.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
    
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => Number(b) - Number(a))[0];

    return {
      totalStudents,
      totalAttendance,
      todayAttendance,
      uniqueStudentsToday,
      weeklyAttendance,
      studentActivity,
      peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A'
    };
  }, [students, attendanceRecords]);

  const [dashboardData, setDashboardData] = useState(calculateDashboardData());

  // Refresh function that updates the dashboard data
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    console.log('Refreshing dashboard data...');
    
    // Simulate a brief loading state
    setTimeout(() => {
      const newData = calculateDashboardData();
      setDashboardData(newData);
      setLastRefresh(new Date());
      setIsRefreshing(false);
      console.log('Dashboard data refreshed:', newData);
    }, 500);
  }, [calculateDashboardData]);

  // Set up periodic refresh - every 5 minutes for general updates
  // In a real application, you might want different intervals for different data
  const { refresh: manualRefresh } = usePeriodicRefresh({
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    onRefresh: refreshData,
    enabled: true
  });

  // Update data when props change
  useEffect(() => {
    setDashboardData(calculateDashboardData());
  }, [calculateDashboardData]);

  const stats = [
    {
      title: "Total Students",
      value: dashboardData.totalStudents.toString(),
      icon: Users,
      description: "Registered in system",
      trend: "+12% from last month"
    },
    {
      title: "Today's Attendance",
      value: dashboardData.todayAttendance.toString(),
      icon: UserCheck,
      description: "Check-ins today",
      trend: `${dashboardData.uniqueStudentsToday} unique students`
    },
    {
      title: "Weekly Activity",
      value: dashboardData.weeklyAttendance.toString(),
      icon: TrendingUp,
      description: "Last 7 days",
      trend: "+8% from last week"
    },
    {
      title: "Total Records",
      value: dashboardData.totalAttendance.toString(),
      icon: Activity,
      description: "All-time attendance",
      trend: "Since system start"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Library Dashboard
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={manualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-muted-foreground text-lg">
          Overview of library attendance and student activity
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {stat.value}
                    </p>
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    {stat.description}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {stat.trend}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity and Top Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Active Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Active Students (This Week)
              {isRefreshing && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.studentActivity.length > 0 ? (
                dashboardData.studentActivity.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.studentId}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {student.weeklyVisits} visits
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No activity this week
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quick Insights
              {isRefreshing && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Average Daily Visits</p>
                  <p className="text-sm text-muted-foreground">Last 7 days</p>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {Math.round(dashboardData.weeklyAttendance / 7)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Student Participation</p>
                  <p className="text-sm text-muted-foreground">Students who visited today</p>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {dashboardData.totalStudents > 0 ? Math.round((dashboardData.uniqueStudentsToday / dashboardData.totalStudents) * 100) : 0}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Peak Hour</p>
                  <p className="text-sm text-muted-foreground">Most active time today</p>
                </div>
                <span className="text-lg font-bold text-primary">
                  {dashboardData.peakHour}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
