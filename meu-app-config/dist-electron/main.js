import { app, ipcMain, dialog, BrowserWindow } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SerialPort, ReadlineParser } from "serialport";
const __filename$1 = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(__filename$1);
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(CURRENT_DIR, "preload.mjs"),
      nodeIntegration: false,
      // Segurança: O React não pode acessar Node direto
      contextIsolation: true
      // Segurança: Isola os contextos
    }
  });
  if (mainWindow == null ? void 0 : mainWindow.webContents) {
    mainWindow.webContents.on("select-bluetooth-device", (event, deviceList, callback) => {
      event.preventDefault();
      if (deviceList && deviceList.length > 0) {
        callback(deviceList[0].deviceId);
      }
    });
  }
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}
app.whenReady().then(createWindow);
ipcMain.handle("dialog:openFile", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Configuração", extensions: ["cefast", "txt"] }]
  });
  if (result.canceled) return null;
  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, "utf-8");
  return { filePath, content };
});
ipcMain.handle("fs:saveFile", async (_, { filePath, content }) => {
  try {
    await fs.writeFile(filePath, content, "utf-8");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("dialog:saveFile", async (_, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: "Configuração", extensions: ["cefast"] }]
  });
  if (result.canceled) return null;
  const filePath = result.filePath;
  try {
    await fs.writeFile(filePath, content, "utf-8");
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
let currentPort = null;
let currentParser = null;
ipcMain.handle("serial:list", async () => {
  return await SerialPort.list();
});
ipcMain.handle("serial:open", async (_, portPath, baudRate = 115200) => {
  if (currentPort) {
    try {
      if (currentPort.isOpen) {
        await new Promise((resolve) => {
          currentPort == null ? void 0 : currentPort.close(() => resolve());
        });
      }
    } catch (_e) {
    }
    currentParser == null ? void 0 : currentParser.removeAllListeners();
    currentParser = null;
    currentPort.removeAllListeners();
    currentPort = null;
  }
  return new Promise((resolve) => {
    const port = new SerialPort({ path: portPath, baudRate, autoOpen: false });
    port.on("error", (err) => {
      console.error("Serial Port Error:", err.message);
      try {
        mainWindow == null ? void 0 : mainWindow.webContents.send("serial:error", err.message);
      } catch (_e) {
      }
    });
    port.open((err) => {
      if (err) {
        port.removeAllListeners();
        try {
          port.destroy();
        } catch (_e) {
        }
        resolve({ success: false, error: err.message });
      } else {
        currentPort = port;
        currentParser = currentPort.pipe(new ReadlineParser({ delimiter: "\n" }));
        currentParser.on("data", (line) => {
          mainWindow == null ? void 0 : mainWindow.webContents.send("serial:data", line);
        });
        currentPort.on("close", () => {
          console.log("Serial port closed unexpectedly");
          currentParser == null ? void 0 : currentParser.removeAllListeners();
          currentParser = null;
          currentPort == null ? void 0 : currentPort.removeAllListeners();
          currentPort = null;
          try {
            mainWindow == null ? void 0 : mainWindow.webContents.send("serial:disconnected");
          } catch (_e) {
          }
        });
        resolve({ success: true });
      }
    });
  });
});
ipcMain.handle("serial:write", async (_, data) => {
  if (!currentPort || !currentPort.isOpen) {
    return { success: false, error: "Porta não está aberta" };
  }
  return new Promise((resolve) => {
    currentPort.write(data, (writeErr) => {
      if (writeErr) {
        console.error("Write Error:", writeErr.message);
        resolve({ success: false, error: writeErr.message });
        return;
      }
      currentPort.drain((drainErr) => {
        if (drainErr) {
          console.error("Drain Error:", drainErr.message);
          resolve({ success: false, error: drainErr.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  });
});
ipcMain.handle("serial:close", async () => {
  if (!currentPort) return { success: true };
  return new Promise((resolve) => {
    if (!currentPort.isOpen) {
      currentParser == null ? void 0 : currentParser.removeAllListeners();
      currentParser = null;
      currentPort.removeAllListeners();
      currentPort = null;
      resolve({ success: true });
      return;
    }
    currentPort.close((err) => {
      if (err) {
        console.error("Error closing port:", err.message);
      }
      currentParser == null ? void 0 : currentParser.removeAllListeners();
      currentParser = null;
      currentPort == null ? void 0 : currentPort.removeAllListeners();
      currentPort = null;
      resolve({ success: true });
    });
  });
});
const cleanup = async () => {
  if (currentPort && currentPort.isOpen) {
    currentParser == null ? void 0 : currentParser.removeAllListeners();
    currentParser = null;
    currentPort.removeAllListeners();
    await new Promise((resolve) => {
      currentPort == null ? void 0 : currentPort.close((err) => {
        if (err) console.error("Error closing port on exit:", err);
        else console.log("Port closed cleanly");
        resolve();
      });
    });
    currentPort = null;
  }
};
app.on("will-quit", cleanup);
process.on("SIGINT", async () => {
  await cleanup();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(0);
});
