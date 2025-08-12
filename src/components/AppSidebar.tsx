
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sidebar, 
  SidebarTrigger, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarContent,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { 
  BarChart3, 
  Scan, 
  RefreshCw, 
  QrCode, 
  Clock, 
  Users, 
  Settings,
  FileText,
  GraduationCap
} from 'lucide-react';

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  attendanceCount: number;
  studentsCount: number;
}

const AppSidebar = ({ activeSection, onSectionChange, attendanceCount, studentsCount }: AppSidebarProps) => {
  const isMobile = useIsMobile();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'scanner', label: 'Scanner & Entry', icon: Scan },
    { id: 'thesis-research', label: 'Past Thesis/Researches', icon: GraduationCap },
    { id: 'sync', label: 'Data Sync', icon: RefreshCw },
    { id: 'qrcode', label: 'QR Registration', icon: QrCode },
    { id: 'attendance', label: 'Attendance', icon: Clock, badge: attendanceCount },
    { id: 'students', label: 'Students', icon: Users, badge: studentsCount },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  return (
    <Sidebar className="border-r border-border/40 bg-gradient-to-b from-background to-muted/20">
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Student Manager</span>
            <span className="text-xs text-muted-foreground">Management System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu className="space-y-1">
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
                className="w-full justify-start h-10 px-3 rounded-lg transition-colors hover:bg-accent/50 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm"
              >
                <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs font-medium min-w-[1.25rem] text-center">
                    {item.badge}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        {isMobile && (
          <div className="flex justify-center">
            <SidebarTrigger className="h-8 w-8" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
