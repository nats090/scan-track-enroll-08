
import { useEffect } from 'react';
import { themeService } from '@/services/themeService';

export const useTheme = () => {
  useEffect(() => {
    // Apply saved theme on app startup
    const theme = themeService.getTheme();
    themeService.applyTheme(theme);
  }, []);

  return {
    applyTheme: themeService.applyTheme,
    saveTheme: themeService.saveTheme,
    getTheme: themeService.getTheme,
    resetTheme: themeService.resetToDefault,
  };
};
