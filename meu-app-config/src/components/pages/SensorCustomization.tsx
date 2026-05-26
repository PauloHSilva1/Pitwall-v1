import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Calculator, Save } from "lucide-react";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useProject } from "@/context/ProjectContext";
import toast from "react-hot-toast";

interface Point {
    x: number | string;
    y: number | string;
}

export default function SensorCustomization() {
    const { projectData, setProjectData } = useProject();
    const [points, setPoints] = useState<Point[]>([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 4 },
    ]);
    const [polynomial, setPolynomial] = useState<string>("");
    const [chartData, setChartData] = useState<any[]>([]);
    const [calculatedCoeffs, setCalculatedCoeffs] = useState<number[] | null>(null);
    const [sensorName, setSensorName] = useState("");

    const handlePointChange = (index: number, field: 'x' | 'y', value: string) => {
        const newPoints = [...points];
        // Allow string to support typing decimals (e.g., "1.", "1.0", "-")
        newPoints[index] = { ...newPoints[index], [field]: value };
        setPoints(newPoints);
    };

    const addPoint = () => {
        if (points.length < 6) {
            setPoints([...points, { x: 0, y: 0 }]);
        }
    };

    const removePoint = (index: number) => {
        if (points.length > 3) {
            const newPoints = points.filter((_, i) => i !== index);
            setPoints(newPoints);
        }
    };

    const calculateLagrange = () => {
        const n = points.length;
        const matrix: number[][] = [];
        const rhs: number[] = [];

        // Parse points for calculation
        const cleanPoints = points.map(p => ({
            x: typeof p.x === 'string' ? parseFloat(p.x) : p.x,
            y: typeof p.y === 'string' ? parseFloat(p.y) : p.y
        })).filter(p => !isNaN(p.x) && !isNaN(p.y));

        if (cleanPoints.length !== n) {
            toast.error("Existem valores inválidos nos pontos.");
            return;
        }

        for (let i = 0; i < n; i++) {
            const row: number[] = [];
            for (let j = 0; j < n; j++) {
                row.push(Math.pow(cleanPoints[i].x, j));
            }
            matrix.push(row);
            rhs.push(cleanPoints[i].y);
        }

        const coeffs = gaussianElimination(matrix, rhs);
        setCalculatedCoeffs(coeffs);

        // Format string
        let polyStr = "y = ";
        let firstTerm = true;
        for (let i = n - 1; i >= 0; i--) {
            const coeff = coeffs[i];
            if (Math.abs(coeff) < 1e-10) continue;
            const sign = coeff >= 0 ? (firstTerm ? "" : " + ") : " - ";
            const absCoeff = Math.abs(coeff).toFixed(6).replace(/\.?0+$/, "");
            let termPart = i === 0 ? "" : i === 1 ? "x" : `x^${i}`;
            polyStr += `${sign}${absCoeff}${termPart}`;
            firstTerm = false;
        }
        if (firstTerm) polyStr += "0";
        setPolynomial(polyStr);

        // Generate Chart Data
        const minX = Math.min(...cleanPoints.map(p => p.x));
        const maxX = Math.max(...cleanPoints.map(p => p.x));
        const padding = (maxX - minX) * 0.2 || 1;
        const start = minX - padding;
        const end = maxX + padding;
        const steps = 100;
        const stepSize = (end - start) / steps;

        const data = [];
        for (let i = 0; i <= steps; i++) {
            const x = start + i * stepSize;
            let y = 0;
            for (let j = 0; j < n; j++) {
                y += coeffs[j] * Math.pow(x, j);
            }
            data.push({ x, y });
        }
        setChartData(data);
    };

    function gaussianElimination(A: number[][], b: number[]): number[] {
        const n = A.length;
        const M = A.map((row, i) => [...row, b[i]]);

        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
            }
            [M[i], M[maxRow]] = [M[maxRow], M[i]];
            if (Math.abs(M[i][i]) < 1e-10) continue;
            for (let k = i + 1; k < n; k++) {
                const factor = M[k][i] / M[i][i];
                for (let j = i; j <= n; j++) {
                    M[k][j] -= factor * M[i][j];
                }
            }
        }
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            if (Math.abs(M[i][i]) < 1e-10) continue;
            let sum = M[i][n];
            for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
            x[i] = sum / M[i][i];
        }
        return x;
    }

    const handleSaveSensor = () => {
        if (!projectData) {
            toast.error("Erro: Dados do projeto não carregados.");
            return;
        }
        if (!calculatedCoeffs) {
            toast.error("Calcule a função primeiro.");
            return;
        }
        if (!sensorName.trim()) {
            toast.error("Digite um nome para o sensor.");
            return;
        }

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        const safeKey = sensorName.trim();

        // Check if exists
        if (newProjectData.config.sensores && newProjectData.config.sensores[safeKey]) {
            if (!confirm(`O sensor "${safeKey}" já existe. Deseja sobrescrever?`)) {
                return;
            }
        }

        // Create sensor object dynamic to number of coeffs
        // IMPORTANT: Saving points for re-editing
        const sensorObj: any = {
            nome: safeKey,
            points: points.map(p => ({
                x: typeof p.x === 'string' ? parseFloat(p.x) : p.x,
                y: typeof p.y === 'string' ? parseFloat(p.y) : p.y
            }))
        };

        calculatedCoeffs.forEach((coeff, index) => {
            sensorObj[`a${index}`] = coeff;
        });

        // Ensure at least a0-a3 exist for compatibility
        for (let i = 0; i <= 3; i++) {
            if (sensorObj[`a${i}`] === undefined) {
                sensorObj[`a${i}`] = 0;
            }
        }

        if (!newProjectData.config.sensores) {
            newProjectData.config.sensores = {};
        }

        newProjectData.config.sensores[safeKey] = sensorObj;
        setProjectData(newProjectData);
        toast.success(`Sensor "${safeKey}" salvo com sucesso!`);
    };

    const handleLoadSensor = (key: string) => {
        if (!projectData?.config?.sensores?.[key]) return;
        const sensor = projectData.config.sensores[key] as any;

        if (sensor.points && Array.isArray(sensor.points)) {
            setPoints(sensor.points);
            setSensorName(sensor.nome || key);
            // Auto-calculate using the loaded points
            calculateLagrange(sensor.points);
            toast.success(`Sensor "${key}" carregado.`);
        } else {
            toast("Este sensor não tem pontos salvos (apenas coeficientes).", { icon: 'ℹ️' });
        }
    };

    const handleDeleteSensor = (key: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!projectData) return;
        if (!confirm(`Excluir sensor "${key}" permanentemente?`)) return;

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        delete newProjectData.config.sensores[key];
        setProjectData(newProjectData);
        toast.success(`Sensor "${key}" excluído.`);
    };

    const sortedSensors = React.useMemo(() => {
        if (!projectData?.config?.sensores) return [];
        return Object.keys(projectData.config.sensores).sort();
    }, [projectData?.config?.sensores]);

    return (
        <div className="h-full flex flex-col p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Personalizar Sensores</h1>
                    <p className="text-zinc-400">Interpolação Polinomial de Lagrange (3 a 6 pontos)</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel - Input */}
                <div className="lg:col-span-4 bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 space-y-4 shadow-xl backdrop-blur-sm h-fit">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-zinc-100">Pontos de Dados</h2>
                        <Button onClick={addPoint} disabled={points.length >= 6} variant="outline" size="sm" className="border-green-800 text-green-500 hover:bg-green-950 hover:text-green-400">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {points.map((point, index) => (
                            <div key={index} className="flex gap-4 items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                                <span className="text-zinc-500 font-mono w-6 text-center">#{index + 1}</span>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">X</label>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={point.x}
                                        onChange={(e) => handlePointChange(index, 'x', e.target.value)}
                                        className="bg-black border-zinc-700 focus:border-red-500 h-9 font-mono"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Y</label>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={point.y}
                                        onChange={(e) => handlePointChange(index, 'y', e.target.value)}
                                        className="bg-black border-zinc-700 focus:border-red-500 h-9 font-mono"
                                        placeholder="0.0"
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removePoint(index)} disabled={points.length <= 3} className="mt-4 hover:bg-red-950 text-zinc-500 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <Button onClick={() => calculateLagrange()} className="w-full bg-red-600 hover:bg-red-700 text-white mt-4 font-bold shadow-lg shadow-red-900/20">
                        <Calculator className="w-4 h-4 mr-2" /> Calcular Função
                    </Button>
                </div>

                {/* Middle Panel - Visuals */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-zinc-900/50 rounded-xl p-8 border border-zinc-800 flex flex-col items-center justify-center min-h-[150px] shadow-xl backdrop-blur-sm">
                        <h2 className="text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-4">Função Resultante</h2>
                        {polynomial ? (
                            <div className="text-xl md:text-2xl font-mono text-white text-center break-all animate-in zoom-in duration-300">
                                {polynomial}
                            </div>
                        ) : (
                            <div className="text-zinc-600 italic">Calcule para ver o resultado...</div>
                        )}
                    </div>

                    <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 shadow-xl backdrop-blur-sm flex-1 min-h-[300px] flex flex-col">
                        <h3 className="text-lg font-semibold text-zinc-300 mb-4">Visualização Gráfica</h3>
                        <div className="flex-1 w-full min-h-[300px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="x" type="number" domain={['auto', 'auto']} stroke="#666" />
                                        <YAxis stroke="#666" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: any) => Number(value).toFixed(3)}
                                        />
                                        <Line type="monotone" dataKey="y" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-600 italic">
                                    O gráfico aparecerá aqui após o cálculo.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sensor Save Section */}
                    {calculatedCoeffs && (
                        <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 shadow-xl backdrop-blur-sm animate-in slide-in-from-bottom-5">
                            <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                                <Save className="w-4 h-4 text-red-500" /> Salvar Sensor
                            </h3>
                            <div className="flex gap-4">
                                <Input
                                    placeholder="Nome do Sensor (ex: Pressão Óleo)"
                                    value={sensorName}
                                    onChange={(e) => setSensorName(e.target.value)}
                                    className="bg-black border-zinc-700 focus:border-red-500 text-zinc-100"
                                />
                                <Button onClick={handleSaveSensor} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-300 font-bold">
                                    <Save className="w-4 h-4 mr-2" /> Salvar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel - Saved Sensors */}
                <div className="lg:col-span-3 bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-xl backdrop-blur-sm flex flex-col overflow-hidden max-h-[800px]">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/80">
                        <h2 className="text-lg font-semibold text-zinc-100">Meus Sensores</h2>
                        <p className="text-xs text-zinc-500">Clique para carregar</p>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {sortedSensors.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-sm">Nenhum sensor salvo.</div>
                        ) : (
                            sortedSensors.map(key => (
                                <div
                                    key={key}
                                    onClick={() => handleLoadSensor(key)}
                                    className="group flex items-center justify-between p-3 rounded-md hover:bg-zinc-800 cursor-pointer transition-colors border border-transparent hover:border-zinc-700"
                                >
                                    <span className="text-zinc-300 text-sm font-medium truncate">{key}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 hover:bg-zinc-900"
                                        onClick={(e) => handleDeleteSensor(key, e)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
