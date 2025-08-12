
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
  branding: {
    logoUrl: string;
    siteName: string;
    favicon: string;
  };
}

const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: '222.2 47.4% 11.2%',
    secondary: '210 40% 96.1%',
    accent: '210 40% 96.1%',
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    muted: '210 40% 96.1%',
    border: '214.3 31.8% 91.4%',
  },
  branding: {
    logoUrl: '/placeholder.svg',
    siteName: 'Scan Track Enroll',
    favicon: '/favicon.ico',
  },
};

export const themeService = {
  getTheme(): ThemeConfig {
    const saved = localStorage.getItem('app-theme');
    return saved ? JSON.parse(saved) : DEFAULT_THEME;
  },

  saveTheme(theme: ThemeConfig): void {
    localStorage.setItem('app-theme', JSON.stringify(theme));
    this.applyTheme(theme);
  },

  applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement;
    
    // Apply color variables
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--border', theme.colors.border);
    
    // Update favicon
    const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (faviconLink) {
      faviconLink.href = theme.branding.favicon;
    }
    
    // Update title
    document.title = theme.branding.siteName;
  },

  resetToDefault(): void {
    this.saveTheme(DEFAULT_THEME);
  },

  // Predefined color schemes
  getColorSchemes() {
    return [
      {
        name: 'Default',
        colors: DEFAULT_THEME.colors,
      },
      {
        name: 'Blue Ocean',
        colors: {
          primary: '221.2 83.2% 53.3%',
          secondary: '210 40% 96.1%',
          accent: '210 40% 96.1%',
          background: '0 0% 100%',
          foreground: '222.2 84% 4.9%',
          muted: '210 40% 96.1%',
          border: '214.3 31.8% 91.4%',
        },
      },
      {
        name: 'Forest Green',
        colors: {
          primary: '142.1 76.2% 36.3%',
          secondary: '210 40% 96.1%',
          accent: '210 40% 96.1%',
          background: '0 0% 100%',
          foreground: '222.2 84% 4.9%',
          muted: '210 40% 96.1%',
          border: '214.3 31.8% 91.4%',
        },
      },
      {
        name: 'Purple Rain',
        colors: {
          primary: '262.1 83.3% 57.8%',
          secondary: '210 40% 96.1%',
          accent: '210 40% 96.1%',
          background: '0 0% 100%',
          foreground: '222.2 84% 4.9%',
          muted: '210 40% 96.1%',
          border: '214.3 31.8% 91.4%',
        },
      },
    ];
  },
};
