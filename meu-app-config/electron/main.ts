import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SerialPort, ReadlineParser } from 'serialport';

// --- Workaround for ESM __dirname ---
const __filename = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(__filename);
let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(CURRENT_DIR, 'preload.mjs'),
      nodeIntegration: false, // Segurança: O React não pode acessar Node direto
      contextIsolation: true, // Segurança: Isola os contextos
    },
  });

  // Bluetooth Handler - Auto-selects first device for now or could ask user if feasible via IPC.
  // For simplicity in this "function" request, we'll try to select the first device found.
  if (mainWindow?.webContents) {
    mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
      event.preventDefault();
      if (deviceList && deviceList.length > 0) {
        callback(deviceList[0].deviceId);
      } else {
        // callback(''); // Cancel if no devices
      }
    });
  }

  // Em dev carrega a URL do Vite, em prod carrega o arquivo buildado
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

// --- FUNÇÕES NATIVAS (IPC) ---

// 1. Abrir Arquivo
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'Configuração', extensions: ['cefast', 'txt'] }]
  });

  if (result.canceled) return null;

  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, 'utf-8');

  return { filePath, content };
});

// 2. Salvar Arquivo
ipcMain.handle('fs:saveFile', async (_, { filePath, content }) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 3. Salvar Arquivo com Diálogo
ipcMain.handle('dialog:saveFile', async (_, content: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    filters: [{ name: 'Configuração', extensions: ['cefast'] }]
  });

  if (result.canceled) return null;

  const filePath = result.filePath;
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true, filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// --- SERIAL PORT ---
let currentPort: SerialPort | null = null;
let currentParser: ReadlineParser | null = null;

ipcMain.handle('serial:list', async () => {
  return await SerialPort.list();
});

ipcMain.handle('serial:open', async (_, portPath: string, baudRate: number = 115200) => {
  // Se já houver porta, fecha antes de abrir nova
  if (currentPort) {
    try {
      if (currentPort.isOpen) {
        await new Promise<void>((resolve) => {
          currentPort?.close(() => resolve());
        });
      }
    } catch (_e) { /* ignora erros ao fechar porta anterior */ }
    currentParser?.removeAllListeners();
    currentParser = null;
    currentPort.removeAllListeners();
    currentPort = null;
  }

  return new Promise((resolve) => {
    const port = new SerialPort({ path: portPath, baudRate, autoOpen: false });

    // Listener de erro global — captura erros assíncronos após abertura
    port.on('error', (err) => {
      console.error('Serial Port Error:', err.message);
      try {
        mainWindow?.webContents.send('serial:error', err.message);
      } catch (_e) { /* janela pode estar fechada */ }
    });

    port.open((err) => {
      if (err) {
        // IMPORTANTE: Destruir a instância criada para não vazar file descriptors no OS
        port.removeAllListeners();
        try { port.destroy(); } catch (_e) { /* já destruído */ }
        resolve({ success: false, error: err.message });
      } else {
        currentPort = port;

        // ReadlineParser bufferiza os bytes e emite linhas completas (delimitadas por \n)
        // Isso garante leitura contínua e limpa — cada evento 'data' é uma linha inteira
        currentParser = currentPort.pipe(new ReadlineParser({ delimiter: '\n' }));

        currentParser.on('data', (line: string) => {
          mainWindow?.webContents.send('serial:data', line);
        });

        // Detectar desconexão inesperada (cabo puxado, device reset)
        currentPort.on('close', () => {
          console.log('Serial port closed unexpectedly');
          currentParser?.removeAllListeners();
          currentParser = null;
          currentPort?.removeAllListeners();
          currentPort = null;
          try {
            mainWindow?.webContents.send('serial:disconnected');
          } catch (_e) { /* janela pode estar fechada */ }
        });

        resolve({ success: true });
      }
    });
  });
});

ipcMain.handle('serial:write', async (_, data: string) => {
  if (!currentPort || !currentPort.isOpen) {
    return { success: false, error: 'Porta não está aberta' };
  }

  return new Promise((resolve) => {
    currentPort!.write(data, (writeErr) => {
      if (writeErr) {
        console.error('Write Error:', writeErr.message);
        resolve({ success: false, error: writeErr.message });
        return;
      }
      // Drain garante que os bytes foram realmente enviados pelo buffer USB/OS
      currentPort!.drain((drainErr) => {
        if (drainErr) {
          console.error('Drain Error:', drainErr.message);
          resolve({ success: false, error: drainErr.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  });
});

ipcMain.handle('serial:close', async () => {
  if (!currentPort) return { success: true };

  return new Promise((resolve) => {
    if (!currentPort!.isOpen) {
      currentParser?.removeAllListeners();
      currentParser = null;
      currentPort!.removeAllListeners();
      currentPort = null;
      resolve({ success: true });
      return;
    }

    // Fecha PRIMEIRO, depois remove listeners — garante que erros de close são capturados
    currentPort!.close((err) => {
      if (err) {
        console.error('Error closing port:', err.message);
      }
      currentParser?.removeAllListeners();
      currentParser = null;
      currentPort?.removeAllListeners();
      currentPort = null;
      resolve({ success: true });
    });
  });
});

// --- CLEANUP ---
const cleanup = async () => {
  if (currentPort && currentPort.isOpen) {
    currentParser?.removeAllListeners();
    currentParser = null;
    currentPort.removeAllListeners();
    await new Promise<void>((resolve) => {
      currentPort?.close((err) => {
        if (err) console.error("Error closing port on exit:", err);
        else console.log('Port closed cleanly');
        resolve();
      });
    });
    currentPort = null;
  }
};

app.on('will-quit', cleanup);

// Handle Ctrl+C in terminal (dev mode)
process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});