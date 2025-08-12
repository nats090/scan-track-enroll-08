
import React from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Database, Clock, Users, Settings, QrCode, LayoutDashboard, ScanLine } from 'lucide-react';
import { cn } from "@/lib/utils";

interface AppNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  attendanceCount: number;
  studentsCount: number;
}

const AppNavigation = ({ activeSection, onSectionChange, attendanceCount, studentsCount }: AppNavigationProps) => {
  const sections = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview and analytics'
    },
    {
      id: 'scanner',
      label: '📋 Student Registration',
      icon: ScanLine,
      description: 'Register students with RFID/barcode scanning + visitor entry'
    },
    {
      id: 'sync',
      label: 'Data Sync',
      icon: Database,
      description: 'Sync data between local storage and Supabase'
    },
    {
      id: 'qrcode',
      label: '🔗 QR Registration',
      icon: QrCode,
      description: 'Generate QR codes for self-registration'
    },
    {
      id: 'attendance',
      label: `Attendance (${attendanceCount})`,
      icon: Clock,
      description: 'View recent attendance records'
    },
    {
      id: 'students',
      label: `Students (${studentsCount})`,
      icon: Users,
      description: 'Manage registered students'
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      description: 'Administrative functions'
    }
  ];

  return (
    <div className="w-full">
      <NavigationMenu className="mx-auto max-w-full">
        <NavigationMenuList className="flex-wrap justify-center gap-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <NavigationMenuItem key={section.id}>
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "cursor-pointer flex items-center gap-2 transition-all duration-200 hover:scale-105",
                    activeSection === section.id && "bg-primary text-primary-foreground shadow-md"
                  )}
                  onClick={() => onSectionChange(section.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                  <span className="sm:hidden">{section.icon.name}</span>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export default AppNavigation;
