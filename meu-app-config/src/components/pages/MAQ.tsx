import React from "react";
import { useProject } from "@/context/ProjectContext";
import { columns, MAQConfig } from "../data/MAQColumns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { MetricDisplay } from "@/components/ui/metric-display";
import { flexRender, getCoreRowModel, useReactTable, ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Database, Zap, Settings2, Radio } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const VEICULO_OPTIONS = ["ES-14", "ES-15", "ES-16", "ES-17"];
const DATALOGGER_OPTIONS = ["MAQV4", "MAQV6"];
const LAPTIMER_OPTIONS = ["GPS", "OPTICO"];
const VELOCIDADE_OPTIONS = ["km/h", "m/s", "mph"];
const TEMPERATURA_OPTIONS = ["°C", "°F"];

export default function MAQ() {
    const { projectData, setProjectData } = useProject();
    const navigate = useNavigate();
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const rawConfigs = projectData?.config?.MAQ || {};
    const data = React.useMemo(() => Object.values(rawConfigs) as MAQConfig[], [rawConfigs]);

    // Calculate stats
    const stats = React.useMemo(() => {
        const selectedIds = Object.keys(rowSelection);
        const hasSelection = selectedIds.length > 0;

        const targetData = hasSelection
            ? data.filter(maq => rowSelection[maq.id])
            : data;

        const totalFreq = targetData.reduce((sum, maq) => sum + (maq.frequenciaTotal || 0), 0);
        const totalChannels = targetData.reduce((sum, maq) => sum + (Array.isArray(maq.canais) ? maq.canais.length : Object.keys(maq.canais || {}).length), 0);
        const activeConfigs = data.filter(maq => maq.frequenciaTotal > 0).length;

        return {
            total: data.length,
            totalFreq,
            totalChannels,
            activeConfigs
        };
    }, [data, rowSelection]);

    const handleDelete = () => {
        if (!projectData) return;

        const idsToDelete = Object.keys(rowSelection);
        if (idsToDelete.length === 0) return;

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        const maqConfigs = newProjectData.config.MAQ;

        Object.keys(maqConfigs).forEach(key => {
            if (idsToDelete.includes(maqConfigs[key].id)) {
                delete maqConfigs[key];
            }
        });

        setProjectData(newProjectData);
        setRowSelection({});
        setDeleteDialogOpen(false);
        toast.success(`${idsToDelete.length} configuração(ões) removida(s)`);
    };

    const updateData = (rowIndex: number, columnId: string, value: any) => {
        if (!projectData) return;

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        const maq = newProjectData.config.MAQ;
        const rowId = data[rowIndex].id;
        const configKey = Object.keys(maq).find(key => maq[key].id === rowId);

        if (configKey) {
            let finalValue = value;
            if (columnId === 'frequenciaTotal') {
                finalValue = Number(value);
            }

            maq[configKey] = {
                ...maq[configKey],
                [columnId]: finalValue
            };
            setProjectData(newProjectData);
        }
    };

    const tableColumns = React.useMemo<ColumnDef<MAQConfig>[]>(() => {
        return columns.map(col => {
            const column = col as any;
            if (column.id === 'select' || column.accessorKey === 'id') return col;

            return {
                ...col,
                cell: ({ row, column: tableCol, getValue }) => {
                    const initialValue = getValue();
                    const [value, setValue] = React.useState(initialValue);

                    React.useEffect(() => {
                        setValue(initialValue);
                    }, [initialValue]);

                    const onBlur = () => {
                        if (value !== initialValue) {
                            updateData(row.index, tableCol.id, value);
                        }
                    };

                    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                        setValue(e.target.value);
                    }

                    const renderSelect = (options: string[]) => (
                        <select
                            className="bg-zinc-900/50 border border-zinc-700/50 text-zinc-100 text-sm rounded-md focus:ring-red-500 focus:border-red-500 block w-full p-1.5 transition-smooth"
                            value={value as string}
                            onChange={(e) => {
                                onChange(e);
                                updateData(row.index, tableCol.id, e.target.value);
                            }}
                        >
                            <option value="">Selecione...</option>
                            {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    );

                    if (tableCol.id === 'veiculo') return renderSelect(VEICULO_OPTIONS);
                    if (tableCol.id === 'dataLogger') return renderSelect(DATALOGGER_OPTIONS);
                    if (tableCol.id === 'lapTimer') return renderSelect(LAPTIMER_OPTIONS);
                    if (tableCol.id === 'velocidade') return renderSelect(VELOCIDADE_OPTIONS);
                    if (tableCol.id === 'temperatura') return renderSelect(TEMPERATURA_OPTIONS);

                    if (tableCol.id === 'frequenciaTotal') {
                        return <span className="text-zinc-100 font-mono-data">{value as number}</span>;
                    }

                    return (
                        <input
                            className="bg-transparent border border-transparent hover:border-zinc-700/50 focus:border-red-500 text-zinc-100 text-sm rounded-md w-full p-1.5 outline-none transition-smooth"
                            value={value as string}
                            onChange={onChange}
                            onBlur={onBlur}
                            type="text"
                        />
                    );
                }
            }
        });
    }, [updateData]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.id,
        enableRowSelection: true,
        enableMultiRowSelection: false,
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection,
        },
    });

    const handleConfigureChannels = () => {
        const selectedId = Object.keys(rowSelection)[0];
        if (!selectedId) return;
        const selectedMAQ = data.find((d) => d.id === selectedId);
        navigate("/maq-canais", { state: { maqData: selectedMAQ } });
    };

    const handleConfigureDash = () => {
        const selectedId = Object.keys(rowSelection)[0];
        if (!selectedId) return;
        const selectedMAQ = data.find((d) => d.id === selectedId);
        navigate("/dash-display", { state: { maqData: selectedMAQ } });
    };

    const handleAdd = () => {
        if (!projectData) return;

        const newId = (Math.max(...Object.keys(rawConfigs).map(Number).filter(n => !isNaN(n)), 0) + 1).toString();

        const newConfig = {
            id: newId,
            nome: `Nova Config ${newId}`,
            veiculo: "ES-17",
            dataLogger: "MAQV6",
            velocidade: "km/h",
            temperatura: "°C",
            lapTimer: "GPS",
            frequenciaTotal: 0,
            canais: []
        };

        const updatedMAQ = { ...rawConfigs, [newId]: newConfig };
        const updatedProjectData = {
            ...projectData,
            config: {
                ...projectData.config,
                MAQ: updatedMAQ
            }
        };

        setProjectData(updatedProjectData);
        toast.success("Nova configuração MAQ criada");
    };

    if (!projectData) return <div className="p-8 text-zinc-400">Carregando projeto...</div>;

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="text-3xl font-bold text-zinc-100">
                    Módulos de Aquisição (MAQ)
                </h1>
                <p className="text-zinc-400">
                    Configure dataloggers e parâmetros de aquisição de dados
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatusCard
                    title="Canais Totais"
                    value={stats.totalChannels}
                    icon={Radio}
                    status={stats.totalChannels > 0 ? "success" : "info"}
                    subtitle="Inputs configurados"
                />
                <StatusCard
                    title="Frequência Total"
                    value={`${stats.totalFreq} Hz`}
                    icon={Zap}
                    status={stats.totalFreq > 0 ? "success" : "error"}
                    subtitle="Amostragem combinada"
                />

            </div>

            {/* Metrics Panel */}
            {stats.total > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="panel-elevated p-6 space-y-4"
                >
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                        Métricas do Sistema
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MetricDisplay
                            label="Canais Ativos"
                            value={stats.totalChannels}
                            max={50}
                            showProgress
                            status="healthy"
                        />
                        <MetricDisplay
                            label="Taxa de Amostragem"
                            value={stats.totalFreq}
                            unit="Hz"
                            max={5000}
                            showProgress
                            status={stats.totalFreq > 2000 ? "warning" : "healthy"}
                        />
                    </div>
                </motion.div>
            )}

            {/* Actions Bar */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button
                        onClick={handleConfigureChannels}
                        disabled={Object.keys(rowSelection).length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Settings2 className="mr-2 h-4 w-4" />
                        Configurar Canais
                    </Button>
                    <Button
                        onClick={handleConfigureDash}
                        disabled={Object.keys(rowSelection).length === 0}
                        className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Radio className="mr-2 h-4 w-4" />
                        Configurar Dash
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={Object.keys(rowSelection).length === 0}
                        className="bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/50"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </Button>
                    <Button onClick={handleAdd} className="btn-primary">
                        <Plus className="mr-2 h-4 w-4" /> Novo
                    </Button>
                </div>
            </div>

            {/* Professional Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="panel-elevated overflow-hidden"
            >
                <Table>
                    <TableHeader className="bg-zinc-900/80 border-b border-white/5">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-0">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="table-header-cell">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="table-row-hover border-b border-white/5 last:border-0"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="table-data-cell">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-zinc-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Database className="w-12 h-12 text-zinc-700" />
                                        <p>Nenhuma configuração MAQ encontrada.</p>
                                        <Button onClick={handleAdd} size="sm" className="btn-primary mt-2">
                                            <Plus className="mr-2 h-4 w-4" /> Criar Primeira Configuração
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </motion.div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-zinc-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-zinc-100">Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente as configurações selecionadas e todos os canais associados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-white/10 text-zinc-300 hover:bg-zinc-700">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}