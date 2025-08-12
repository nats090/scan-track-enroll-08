
import React from 'react';
import { themeService } from '@/services/themeService';

const AppHeader = () => {
  const theme = themeService.getTheme();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          {theme.branding.logoUrl && (
            <img 
              src={theme.branding.logoUrl} 
              alt={theme.branding.siteName}
              className="h-8 w-auto"
            />
          )}
          <h1 className="text-lg font-semibold">{theme.branding.siteName}</h1>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
