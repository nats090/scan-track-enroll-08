export interface ElectronAPI {
  platform: string;
  versions: any;
  saveData: (data: any) => Promise<{ success: boolean; error?: string }>;
  loadData: () => Promise<{ success: boolean; data?: any; error?: string }>;
  clearData: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}