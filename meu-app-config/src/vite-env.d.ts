/// <reference types="vite/client" />
// Tipagem para o TypeScript entender nossa ponte

declare global {
  interface Window {
    api: {
      openFile: () => Promise<{ filePath: string; content: string } | null>;
      saveFile: (path: string, content: string) => Promise<{ success: boolean }>;
      saveFileDialog: (content: string) => Promise<{ success: boolean; filePath?: string } | null>;

      // Serial API
      listSerial: () => Promise<any[]>;
      openSerial: (path: string, baudRate?: number) => Promise<{ success: boolean; error?: string }>;
      writeSerial: (data: string) => Promise<{ success: boolean; error?: string }>;
      closeSerial: () => Promise<{ success: boolean }>;
      onSerialData: (callback: (data: string) => void) => (() => void);
      onSerialError: (callback: (error: string) => void) => (() => void);
      onSerialDisconnected: (callback: () => void) => (() => void);
      removeAllSerialListeners: () => void;
    };
  }
  interface ProjectData {
    path: string;
    content: string;
    [key: string]: any; // Isso permite acessar projectData["qualquer_coisa"]
  }
}

export { };