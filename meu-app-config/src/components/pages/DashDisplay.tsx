import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useProject } from "@/context/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, ArrowLeft } from "lucide-react";
import { MAQConfig } from "../data/MAQColumns";

export default function DashDisplay() {
    const { projectData, setProjectData } = useProject();
    const location = useLocation();
    const navigate = useNavigate();
    const maqData = location.state?.maqData as MAQConfig | undefined;

    // Default state
    const [layout, setLayout] = useState<number>(4);
    const [selectedSensors, setSelectedSensors] = useState<string[]>(Array(6).fill(""));

    // Redirect if no MAQ selected
    useEffect(() => {
        if (!maqData) {
            navigate("/maq");
        }
    }, [maqData, navigate]);

    // Live MAQ Data from project context using ID
    const liveMaqData = React.useMemo(() => {
        if (!projectData?.config?.MAQ || !maqData?.id) return undefined;
        return Object.values(projectData.config.MAQ).find((m: any) => m.id === maqData.id) as MAQConfig | undefined;
    }, [projectData, maqData]);

    // Load from specific MAQ config on mount/update
    useEffect(() => {
        if (liveMaqData && (liveMaqData as any).dash) {
            const dashConfig = (liveMaqData as any).dash;
            setLayout(dashConfig.layout || 4);
            const savedSensors = dashConfig.sensors || [];
            const paddedSensors = [...savedSensors, ...Array(6).fill("")].slice(0, 6);
            setSelectedSensors(paddedSensors);
        } else {
            // Reset to default if not present
            setLayout(4);
            setSelectedSensors(Array(6).fill(""));
        }
    }, [liveMaqData]);

    // Get available sensor types from THIS MAQ's channels
    const availableSensors = React.useMemo(() => {
        if (!liveMaqData?.canais) return [];

        const sensorSet = new Set<string>();
        const channels = Array.isArray(liveMaqData.canais) ? liveMaqData.canais : Object.values(liveMaqData.canais);

        channels.forEach((channel: any) => {
            if (channel.tipo && channel.tipo !== "default" && channel.tipo !== "") {
                sensorSet.add(channel.tipo);
            }
        });

        return Array.from(sensorSet).sort();
    }, [liveMaqData]);

    // Save to projectData under the specific MAQ key
    const saveConfig = (newLayout: number, newSensors: string[]) => {
        if (!projectData || !liveMaqData) return;

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        const maqKey = Object.keys(newProjectData.config.MAQ).find(key => newProjectData.config.MAQ[key].id === liveMaqData.id);

        if (!maqKey) return;

        // Ensure dash object exists
        if (!newProjectData.config.MAQ[maqKey].dash) {
            newProjectData.config.MAQ[maqKey].dash = {};
        }

        newProjectData.config.MAQ[maqKey].dash = {
            layout: newLayout,
            sensors: newSensors
        };

        setProjectData(newProjectData);
    };

    const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const num = parseInt(e.target.value);
        setLayout(num);
        saveConfig(num, selectedSensors);
    };

    const handleSensorChange = (index: number, e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const newSensors = [...selectedSensors];
        newSensors[index] = value;
        setSelectedSensors(newSensors);
        saveConfig(layout, newSensors);
    };

    // Render Preview Boxes
    const renderPreview = () => {
        const boxes = [];
        for (let i = 0; i < layout; i++) {
            boxes.push(
                <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center aspect-square shadow-inner transform transition-all hover:scale-105 hover:border-red-900/50">
                    <span className="text-4xl font-mono font-bold text-red-600 mb-2 animate-pulse">--.-</span>
                    <span className="text-xs uppercase text-zinc-500 font-bold tracking-wider text-center px-2 truncate w-full">
                        {selectedSensors[i] && selectedSensors[i] !== "none" ? selectedSensors[i] : "Vazio"}
                    </span>
                </div>
            );
        }

        let gridCols = "grid-cols-2";
        if (layout === 1) gridCols = "grid-cols-1 max-w-[400px]";
        else if (layout === 2) gridCols = "grid-cols-2";
        else if (layout === 3) gridCols = "grid-cols-3";
        else if (layout === 4) gridCols = "grid-cols-2";
        else if (layout === 5) gridCols = "grid-cols-3";
        else if (layout === 6) gridCols = "grid-cols-3";

        return (
            <div className={`grid ${gridCols} gap-4 w-full h-full content-center transition-all duration-300`}>
                {boxes}
            </div>
        );
    };

    if (!maqData) return null;

    return (
        <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/maq")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Dash Display</h1>
                    <p className="text-zinc-400">
                        Configuração para: <span className="text-red-500 font-bold">{maqData.nome}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                {/* Configuration Panel */}
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-zinc-100">
                            <Monitor className="w-5 h-5 text-red-500" />
                            Configuração
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Layout (Quantidade de Dados)</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-off-red-600 focus:border-red-600 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-100"
                                value={layout}
                                onChange={handleLayoutChange}
                            >
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>
                                        {num} {num === 1 ? 'Dado' : 'Dados'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <label className="text-sm font-medium text-zinc-400 uppercase tracking-wide block mb-4">Sensores Disponíveis</label>
                            {availableSensors.length === 0 && (
                                <p className="text-xs text-yellow-600 mb-4 bg-yellow-900/20 p-2 rounded border border-yellow-900/50">
                                    Nenhum sensor configurado nesta MAQ. Volte para "Canais" e defina os tipos dos sensores.
                                </p>
                            )}

                            {Array.from({ length: layout }).map((_, index) => (
                                <div key={index} className="space-y-1 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                    <label className="text-xs text-zinc-500 font-mono">Posição #{index + 1}</label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-100 placeholder:text-zinc-500"
                                        value={selectedSensors[index]}
                                        onChange={(e) => handleSensorChange(index, e)}
                                    >
                                        <option value="" className="text-zinc-500">-- Selecione um sensor --</option>
                                        {availableSensors.map(sensor => (
                                            <option key={sensor} value={sensor}>
                                                {sensor}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Live Preview Panel */}
                <div className="lg:col-span-2 bg-black border-[10px] border-zinc-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[400px]">
                    {/* Glossy Reflection Effect */}
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-12 pointer-events-none" />

                    {renderPreview()}
                </div>
            </div>
        </div>
    );
}
