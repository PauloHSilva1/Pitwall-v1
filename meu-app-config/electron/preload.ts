import { contextBridge, ipcRenderer } from 'electron';

if (!ipcRenderer) {
  console.error("Eletron IPC Renderer não foi carregado corretamente.");
}

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer?.invoke('dialog:openFile'),
  saveFile: (filePath: string, content: string) =>
    ipcRenderer?.invoke('fs:saveFile', { filePath, content }),
  saveFileDialog: (content: string) => ipcRenderer?.invoke('dialog:saveFile', content),

  // Serial API
  listSerial: () => ipcRenderer?.invoke('serial:list'),
  openSerial: (path: string, baudRate?: number) => ipcRenderer?.invoke('serial:open', path, baudRate),
  writeSerial: (data: string) => ipcRenderer?.invoke('serial:write', data),
  closeSerial: () => ipcRenderer?.invoke('serial:close'),

  // Serial event listeners — registrar/desregistrar de forma limpa
  onSerialData: (callback: (data: string) => void) => {
    const handler = (_: any, data: string) => callback(data);
    ipcRenderer?.on('serial:data', handler);
    // Retorna função de cleanup para remover apenas este listener específico
    return () => ipcRenderer?.removeListener('serial:data', handler);
  },
  onSerialError: (callback: (error: string) => void) => {
    const handler = (_: any, error: string) => callback(error);
    ipcRenderer?.on('serial:error', handler);
    return () => ipcRenderer?.removeListener('serial:error', handler);
  },
  onSerialDisconnected: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer?.on('serial:disconnected', handler);
    return () => ipcRenderer?.removeListener('serial:disconnected', handler);
  },
  // Cleanup total — remove todos os listeners de serial de uma vez
  removeAllSerialListeners: () => {
    ipcRenderer?.removeAllListeners('serial:data');
    ipcRenderer?.removeAllListeners('serial:error');
    ipcRenderer?.removeAllListeners('serial:disconnected');
  },
});