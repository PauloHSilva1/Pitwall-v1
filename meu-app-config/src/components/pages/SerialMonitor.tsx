import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plug, PlugZap, Send, RefreshCcw, ScanSearch } from "lucide-react";

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 250000, 500000, 921600, 1000000];

// Helper: identifica se uma porta é virtual Bluetooth pelo metadata do Windows
const isBluetoothPort = (port: any): boolean => {
    const pnp = (port.pnpId || "").toUpperCase();
    const friendly = (port.friendlyName || "").toUpperCase();
    const manufacturer = (port.manufacturer || "").toUpperCase();
    return pnp.includes("BTHENUM") || friendly.includes("BLUETOOTH") || friendly.includes("BTH") || manufacturer.includes("BLUETOOTH");
};

export default function SerialMonitor() {
    const [ports, setPorts] = useState<any[]>([]);
    const [selectedPort, setSelectedPort] = useState<string>("");
    const [baudRate, setBaudRate] = useState<number>(115200);
    const [isConnected, setIsConnected] = useState(false);
    const [inputText, setInputText] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [isAutoDetecting, setIsAutoDetecting] = useState(false);

    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const responseResolverRef = useRef<((value: string) => void) | null>(null);
    const isAutoDetectingRef = useRef(false);

    const addLog = useCallback((msg: string) => {
        setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    }, []);

    useEffect(() => {
        fetchPorts();

        // Registra listeners e guarda as funções de cleanup retornadas
        const cleanupData = window.api.onSerialData((data: string) => {
            // Se tiver alguém esperando resposta (handshake), resolve
            if (responseResolverRef.current) {
                responseResolverRef.current(data);
                responseResolverRef.current = null;
            }
            addLog(`RX: ${data.trim()}`);
        });

        const cleanupError = window.api.onSerialError((error: string) => {
            addLog(`⚠ Erro serial: ${error}`);
        });

        const cleanupDisconnect = window.api.onSerialDisconnected(() => {
            setIsConnected(false);
            addLog("⚡ Dispositivo desconectado inesperadamente.");
        });

        return () => {
            cleanupData();
            cleanupError();
            cleanupDisconnect();
            stopAutoDetect();
        };
    }, []);

    const fetchPorts = async () => {
        try {
            const portsList = await window.api.listSerial();

            // Filtra portas virtuais de Bluetooth para mostrar apenas dispositivos fisicamente conectados
            const filteredPorts = portsList.filter((port) => !isBluetoothPort(port));

            setPorts(filteredPorts);

            if (filteredPorts.length > 0) {
                if (!selectedPort || !filteredPorts.some((p) => p.path === selectedPort)) {
                    setSelectedPort(filteredPorts[0].path);
                }
            } else {
                setSelectedPort("");
            }

            return filteredPorts;
        } catch (error) {
            console.error("Erro ao listar portas", error);
            return [];
        }
    };

    const handleConnect = async () => {
        if (isConnected) {
            await window.api.closeSerial();
            setIsConnected(false);
            addLog("Desconectado.");
        } else {
            if (!selectedPort) return;
            try {
                const res = await window.api.openSerial(selectedPort, baudRate);
                if (res.success) {
                    setIsConnected(true);
                    addLog(`Conectado a ${selectedPort} com ${baudRate} baud.`);
                } else {
                    addLog(`Erro ao conectar: ${res.error}`);
                }
            } catch (error: any) {
                addLog(`Erro ao conectar: ${error.message || error}`);
            }
        }
    };

    const handleSend = async () => {
        if (!inputText) return;
        try {
            const res = await window.api.writeSerial(inputText + "\n");
            if (res.success) {
                addLog(`TX: ${inputText}`);
                setInputText("");
            } else {
                addLog(`Erro ao enviar: ${res.error}`);
            }
        } catch (error: any) {
            addLog(`Erro ao enviar: ${error.message || error}`);
        }
    };

    // --- AUTO DETECT LOGIC ---
    const toggleAutoDetect = () => {
        if (isAutoDetecting) {
            stopAutoDetect();
            addLog("Auto-detect parado.");
        } else {
            setIsAutoDetecting(true);
            isAutoDetectingRef.current = true;
            addLog("Iniciando varredura...");
            startAutoDetect();
        }
    };

    const stopAutoDetect = () => {
        setIsAutoDetecting(false);
        isAutoDetectingRef.current = false;
        if (scanIntervalRef.current) {
            clearTimeout(scanIntervalRef.current as NodeJS.Timeout);
            scanIntervalRef.current = null;
        }
    };

    const startAutoDetect = async () => {
        scanIntervalRef.current = setTimeout(async () => {
            if (isConnected || !isAutoDetectingRef.current) return;

            // fetchPorts já retorna apenas portas USB/físicas (Bluetooth excluído)
            const physicalPorts = await fetchPorts();

            if (physicalPorts.length === 0) {
                addLog("Nenhuma porta USB/Física detectada para varredura. Conecte o dispositivo via USB.");
                stopAutoDetect();
                return;
            }

            for (const port of physicalPorts) {
                if (isConnected || !isAutoDetectingRef.current) break;

                addLog(`Testando porta ${port.path}...`);
                try {
                    // 1. Abre a porta
                    const res = await window.api.openSerial(port.path, 115200);
                    if (!res.success) {
                        addLog(`Porta ${port.path} indisponível: ${res.error}`);
                        continue; // Próxima porta, sem precisar fechar
                    }

                    // 2. Envia Handshake
                    await window.api.writeSerial("OI\n");

                    // 3. Espera resposta por 1500ms
                    const response = await waitForResponse(1500);

                    if (response && (response.includes("MAQ") || response.includes("PDM") || response.includes("DASH"))) {
                        // Dispositivo Identificado!
                        addLog(`✅ Dispositivo Identificado: ${response.trim()} na porta ${port.path}`);

                        // Fecha a conexão de teste
                        await window.api.closeSerial().catch(() => { });

                        // Define a porta selecionada e reconecta definitivamente
                        setSelectedPort(port.path);
                        const connectRes = await window.api.openSerial(port.path, 115200);
                        if (!connectRes.success) {
                            addLog(`Erro ao reconectar: ${connectRes.error}`);
                            continue;
                        }

                        setIsConnected(true);
                        stopAutoDetect();
                        return;
                    } else {
                        // Não é o dispositivo, fecha e tenta próxima
                        await window.api.closeSerial().catch(() => { });
                    }

                } catch (err: any) {
                    await window.api.closeSerial().catch(() => { });
                }
            }

            // Não achou — agenda próxima varredura
            if (isAutoDetectingRef.current && !isConnected) {
                startAutoDetect();
            }
        }, 1000);
    };

    const waitForResponse = (timeoutMs: number): Promise<string | null> => {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                responseResolverRef.current = null;
                resolve(null);
            }, timeoutMs);

            responseResolverRef.current = (data) => {
                clearTimeout(timeout);
                resolve(data);
            };
        });
    };

    return (
        <div className="p-8 h-full flex flex-col text-zinc-100">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <PlugZap className="text-red-600" /> Serial Monitor
            </h1>

            <div className="flex gap-4 mb-6 items-end bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                <div className="flex-1">
                    <label className="text-xs text-zinc-500 mb-1 block">Porta COM</label>
                    <select
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm outline-none focus:border-red-600"
                        value={selectedPort}
                        onChange={(e) => setSelectedPort(e.target.value)}
                        disabled={isConnected || isAutoDetecting}
                    >
                        {ports.map((port) => (
                            <option key={port.path} value={port.path}>
                                {port.path} {port.manufacturer ? `(${port.manufacturer})` : ""}
                            </option>
                        ))}
                        {ports.length === 0 && <option value="">Nenhuma porta encontrada</option>}
                    </select>
                </div>

                <div className="w-32">
                    <label className="text-xs text-zinc-500 mb-1 block">Baud Rate</label>
                    <select
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm outline-none focus:border-red-600"
                        value={baudRate}
                        onChange={(e) => setBaudRate(Number(e.target.value))}
                        disabled={isConnected || isAutoDetecting}
                    >
                        {BAUD_RATES.map((rate) => (
                            <option key={rate} value={rate}>{rate}</option>
                        ))}
                    </select>
                </div>

                <Button onClick={() => fetchPorts()} variant="outline" size="icon" disabled={isConnected || isAutoDetecting}>
                    <RefreshCcw className="h-4 w-4" />
                </Button>

                <Button
                    onClick={handleConnect}
                    disabled={isAutoDetecting}
                    className={isConnected ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                    {isConnected ? <><Plug className="mr-2 h-4 w-4" /> Desconectar</> : <><PlugZap className="mr-2 h-4 w-4" /> Conectar</>}
                </Button>

                <Button
                    onClick={toggleAutoDetect}
                    disabled={isConnected}
                    className={isAutoDetecting ? "bg-orange-600 hover:bg-orange-700 animate-pulse" : "bg-zinc-700 hover:bg-zinc-600"}
                >
                    <ScanSearch className="mr-2 h-4 w-4" /> {isAutoDetecting ? "Buscando..." : "Auto Detectar"}
                </Button>
            </div>

            <div className="flex gap-2 mb-4">
                <Input
                    placeholder="Digite o comando para enviar..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!isConnected}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="bg-zinc-950 border-zinc-800 font-mono"
                />
                <Button onClick={handleSend} disabled={!isConnected} className="bg-zinc-800 hover:bg-zinc-700">
                    <Send className="mr-2 h-4 w-4" /> Enviar
                </Button>
            </div>

            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-y-auto">
                {logs.length === 0 ? (
                    <span className="text-zinc-600">O log de comunicação aparecerá aqui...</span>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-zinc-900 pb-1 last:border-0">
                            {log}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
