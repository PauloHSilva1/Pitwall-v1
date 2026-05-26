"use strict";
const electron = require("electron");
if (!electron.ipcRenderer) {
  console.error("Eletron IPC Renderer não foi carregado corretamente.");
}
electron.contextBridge.exposeInMainWorld("api", {
  openFile: () => {
    var _a;
    return (_a = electron.ipcRenderer) == null ? void 0 : _a.invoke("dialog:openFile");
  },
  saveFile: (filePath, content) => {
    var _a;
    return (_a = electron.ipcRenderer) == null ? void 0 : _a.invoke("fs:saveFile", { filePath, content });
  },
  saveFileDialog: (content) => {
    var _a;
    return (_a = electron.ipcRenderer) == null ? void 0 : _a.invoke("dialog:saveFile", content);
  },
  // Serial API
  listSerial: () => {
    var _a;
    return (_a = electron.ipcRenderer) == null ? void 0 : _a.invoke("serial:list");
  },
  openSerial: (path, baudRate) => {
    var _a;
    return (_a = electron.ipcRenderer) == null ? void 0 : _a.invoke("serial:open", path, baudRate);
  },
  writeSerial: (data) => {
    var _a;
    return (_a = electron.ipcRenderer) == null ? void 0 : _a.invoke("serial:write", data);
  },
  closeSerial: () => {
    var _a;
    return (_a = electron.ipcRenderer) == null ? void 0 : _a.invoke("serial:close");
  },
  // Serial event listeners — registrar/desregistrar de forma limpa
  onSerialData: (callback) => {
    var _a;
    const handler = (_, data) => callback(data);
    (_a = electron.ipcRenderer) == null ? void 0 : _a.on("serial:data", handler);
    return () => {
      var _a2;
      return (_a2 = electron.ipcRenderer) == null ? void 0 : _a2.removeListener("serial:data", handler);
    };
  },
  onSerialError: (callback) => {
    var _a;
    const handler = (_, error) => callback(error);
    (_a = electron.ipcRenderer) == null ? void 0 : _a.on("serial:error", handler);
    return () => {
      var _a2;
      return (_a2 = electron.ipcRenderer) == null ? void 0 : _a2.removeListener("serial:error", handler);
    };
  },
  onSerialDisconnected: (callback) => {
    var _a;
    const handler = () => callback();
    (_a = electron.ipcRenderer) == null ? void 0 : _a.on("serial:disconnected", handler);
    return () => {
      var _a2;
      return (_a2 = electron.ipcRenderer) == null ? void 0 : _a2.removeListener("serial:disconnected", handler);
    };
  },
  // Cleanup total — remove todos os listeners de serial de uma vez
  removeAllSerialListeners: () => {
    var _a, _b, _c;
    (_a = electron.ipcRenderer) == null ? void 0 : _a.removeAllListeners("serial:data");
    (_b = electron.ipcRenderer) == null ? void 0 : _b.removeAllListeners("serial:error");
    (_c = electron.ipcRenderer) == null ? void 0 : _c.removeAllListeners("serial:disconnected");
  }
});
