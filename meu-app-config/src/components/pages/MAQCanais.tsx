import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MAQConfig, canalColumns, Canal } from "../data/MAQColumns";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";

import { ArrowLeft, Plus, Trash2, Radio, Activity, Zap } from "lucide-react";
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
import { useProject } from "@/context/ProjectContext";
import { ColumnDef } from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Search } from "lucide-react";

const MOCKED_UNITS = [
    "km/h", "m/s", "mph",
    "°C", "°F",
    "rpm",
    "V", "mV",
    "A", "mA",
    "bar", "psi", "kPa",
    "g",
    "deg/s", "rad/s",
    "%",
    "m", "mm",
    "s", "ms"
];

export default function MAQCanais() {
    const location = useLocation();
    const navigate = useNavigate();
    const maqData = location.state?.maqData as MAQConfig | undefined;
    const [rowSelection, setRowSelection] = React.useState({});
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const { projectData, setProjectData } = useProject();

    const handleDelete = () => {
        if (!projectData || !liveMaqData) return;

        const idsToDelete = Object.keys(rowSelection);
        if (idsToDelete.length === 0) return;

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        const maqKey = Object.keys(newProjectData.config.MAQ).find(key => newProjectData.config.MAQ[key].id === liveMaqData.id);
        if (!maqKey) return;

        let channels = Array.isArray(newProjectData.config.MAQ[maqKey].canais)
            ? [...newProjectData.config.MAQ[maqKey].canais]
            : Object.values(newProjectData.config.MAQ[maqKey].canais);

        channels = channels.filter((channel: any) => !idsToDelete.includes(channel.id));

        const newTotalFreq = channels.reduce((acc: number, curr: any) => {
            if (curr.ativado !== 1) return acc;
            const freq = Number(curr.frequencia);
            return isNaN(freq) ? acc : acc + freq;
        }, 0);

        newProjectData.config.MAQ[maqKey].canais = channels;
        newProjectData.config.MAQ[maqKey].frequenciaTotal = newTotalFreq;

        setProjectData(newProjectData);
        setRowSelection({});
        setDeleteDialogOpen(false);
        toast.success(`${idsToDelete.length} canal(is) removido(s)`);
    };

    const liveMaqData = React.useMemo(() => {
        if (!projectData?.config?.MAQ || !maqData?.id) return undefined;
        return Object.values(projectData.config.MAQ).find((m: any) => m.id === maqData.id) as MAQConfig | undefined;
    }, [projectData, maqData]);

    const sensores = React.useMemo(() => {
        if (!projectData?.config?.sensores) return [];
        return Object.values(projectData.config.sensores).map(s => (s as any).nome);
    }, [projectData]);

    const data = React.useMemo(() => {
        if (!liveMaqData?.canais) return [];
        return Array.isArray(liveMaqData.canais)
            ? liveMaqData.canais
            : Object.values(liveMaqData.canais);
    }, [liveMaqData]);

    // Calculate stats
    const stats = React.useMemo(() => {
        const activeChannels = data.filter((c: any) => c.ativado === 1).length;
        const totalFreq = data.reduce((sum: number, c: any) => {
            if (c.ativado !== 1) return sum;
            return sum + (Number(c.frequencia) || 0);
        }, 0);


        return {
            total: data.length,
            active: activeChannels,
            totalFreq,
        };
    }, [data]);

    const updateData = (rowIndex: number, columnId: string, value: any) => {
        if (!projectData || !liveMaqData) return;

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        const maqKey = Object.keys(newProjectData.config.MAQ).find(key => newProjectData.config.MAQ[key].id === liveMaqData.id);
        if (!maqKey) return;

        let channels = Array.isArray(newProjectData.config.MAQ[maqKey].canais)
            ? [...newProjectData.config.MAQ[maqKey].canais]
            : Object.values(newProjectData.config.MAQ[maqKey].canais);

        const rowId = data[rowIndex].id;
        const channelIndex = channels.findIndex((c: any) => c.id === rowId);
        if (channelIndex === -1) return;

        let finalValue = value;
        if (['frequencia', 'escalaBaixa', 'escalaAlta', 'ativado'].includes(columnId)) {
            finalValue = Number(value);
        }

        channels[channelIndex] = {
            ...channels[channelIndex],
            [columnId]: finalValue
        };

        const newTotalFreq = channels.reduce((acc: number, curr: any) => {
            if (curr.ativado !== 1) return acc;
            const freq = Number(curr.frequencia);
            return isNaN(freq) ? acc : acc + freq;
        }, 0);

        newProjectData.config.MAQ[maqKey].canais = channels;
        newProjectData.config.MAQ[maqKey].frequenciaTotal = newTotalFreq;

        setProjectData(newProjectData);
    };

    const tableColumns = React.useMemo<ColumnDef<Canal>[]>(() => {
        return canalColumns.map(col => {
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
                    };

                    if (tableCol.id === 'tipo') {
                        return (
                            <select
                                className="bg-zinc-900/50 border border-zinc-700/50 text-zinc-100 text-sm rounded-md focus:ring-red-500 focus:border-red-500 block w-full p-1.5 transition-smooth"
                                value={value as string}
                                onChange={(e) => {
                                    onChange(e);
                                    updateData(row.index, tableCol.id, e.target.value);
                                }}
                            >
                                <option value="">Selecione...</option>
                                {sensores.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        );
                    }

                    if (tableCol.id === 'sensor') {
                        const isValid = value !== "" && value !== "null";
                        return (
                            <select
                                className={`bg-zinc-900/50 border text-zinc-100 text-sm rounded-md focus:ring-red-500 focus:border-red-500 block w-full p-1.5 transition-smooth ${!isValid ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-700/50'
                                    }`}
                                value={value as string}
                                onChange={(e) => {
                                    onChange(e);
                                    updateData(row.index, tableCol.id, e.target.value);
                                }}
                            >
                                <option value="">Selecione...</option>
                                {sensores.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        );
                    }

                    if (tableCol.id === 'unidade') {
                        return (
                            <select
                                className="bg-zinc-900/50 border border-zinc-700/50 text-zinc-100 text-sm rounded-md focus:ring-red-500 focus:border-red-500 block w-full p-1.5 transition-smooth"
                                value={value as string}
                                onChange={(e) => {
                                    onChange(e);
                                    updateData(row.index, tableCol.id, e.target.value);
                                }}
                            >
                                <option value="">...</option>
                                {MOCKED_UNITS.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        );
                    }

                    if (tableCol.id === 'ativado') {
                        return (
                            <input
                                type="checkbox"
                                checked={Number(value) === 1}
                                onChange={(e) => {
                                    const newVal = e.target.checked ? 1 : 0;
                                    setValue(newVal);
                                    updateData(row.index, tableCol.id, newVal);
                                }}
                                className="w-4 h-4 text-red-600 bg-zinc-900 border-zinc-700 rounded focus:ring-red-500"
                            />
                        );
                    }

                    const isNumeric = ['frequencia', 'escalaBaixa', 'escalaAlta'].includes(tableCol.id);

                    return (
                        <input
                            className={`bg-transparent border border-transparent hover:border-zinc-700/50 focus:border-red-500 text-sm rounded px-2 py-1.5 w-full outline-none transition-smooth ${isNumeric ? 'font-mono-data text-right' : 'text-zinc-100'
                                }`}
                            value={value as string}
                            onChange={onChange}
                            onBlur={onBlur}
                            type={isNumeric ? "number" : "text"}
                        />
                    );
                }
            };
        });
    }, [updateData, sensores]);

    const [globalFilter, setGlobalFilter] = React.useState("");

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getRowId: (row: any) => row.id,
        enableRowSelection: true,
        enableMultiRowSelection: true,
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection,
            globalFilter,
        },
        globalFilterFn: (row, columnId, filterValue) => {
            const safeValue = filterValue.toLowerCase();
            const id = (row.getValue("id") as string)?.toLowerCase() || "";
            const nome = (row.getValue("nome") as string)?.toLowerCase() || "";
            const sensor = (row.original as any).sensor?.toLowerCase() || "";

            return id.includes(safeValue) || nome.includes(safeValue) || sensor.includes(safeValue);
        }
    });

    const handleAdd = () => {
        if (!projectData || !liveMaqData) return;

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        const maqKey = Object.keys(newProjectData.config.MAQ).find(key => newProjectData.config.MAQ[key].id === liveMaqData.id);
        if (!maqKey) return;

        let channels: any[] = Array.isArray(newProjectData.config.MAQ[maqKey].canais)
            ? [...newProjectData.config.MAQ[maqKey].canais]
            : Object.values(newProjectData.config.MAQ[maqKey].canais);

        const newId = (Math.max(...channels.map((c: any) => Number(c.id)).filter(n => !isNaN(n)), 0) + 1).toString();

        const newChannel = {
            id: newId,
            nome: `Novo Canal ${newId}`,
            tipo: "",
            sensor: "",
            unidade: "",
            frequencia: 0,
            escalaBaixa: 0,
            escalaAlta: 0,
            ativado: 0
        };

        channels.push(newChannel);
        newProjectData.config.MAQ[maqKey].canais = channels;

        setProjectData(newProjectData);
        toast.success("Novo canal criado");
    };

    if (!maqData) {
        return (
            <div className="p-8 text-center">
                <p className="text-zinc-400 mb-4">Nenhuma configuração MAQ foi passada.</p>
                <Button onClick={() => navigate("/maq")} className="btn-secondary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para MAQ
                </Button>
            </div>
        );
    }

    if (!liveMaqData) {
        return (
            <div className="p-8 text-center">
                <p className="text-zinc-400 mb-4">Configuração MAQ não encontrada.</p>
                <Button onClick={() => navigate("/maq")} className="btn-secondary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para MAQ
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Button
                    onClick={() => navigate("/maq")}
                    variant="ghost"
                    className="mb-4 text-zinc-400 hover:text-zinc-100"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para MAQ
                </Button>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-zinc-100">
                        Canais - {liveMaqData.nome}
                    </h1>
                    <p className="text-zinc-400">
                        Configure os canais de aquisição, sensores e frequências
                    </p>
                </div>
            </motion.div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusCard
                    title="Canais Totais"
                    value={stats.total}
                    icon={Radio}
                    status={stats.total > 0 ? "success" : "warning"}
                    subtitle="Configurados"
                />
                <StatusCard
                    title="Canais Ativos"
                    value={`${stats.active}/${stats.total}`}
                    icon={Activity}
                    status={stats.active === stats.total ? "success" : "warning"}
                    subtitle="Ativado = true"
                />
                <StatusCard
                    title="Frequência Total"
                    value={`${stats.totalFreq} Hz`}
                    icon={Zap}
                    status={stats.totalFreq > 0 ? "success" : "error"}
                    subtitle="Soma das frequências"
                />
            </div>



            {/* Actions Bar */}
            <div className="flex justify-between gap-2 items-center">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar canais..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-8 bg-zinc-900 border-zinc-700 focus:border-red-500"
                    />
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
                        <Plus className="mr-2 h-4 w-4" /> Novo Canal
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
                                <TableRow key={row.id} className="table-row-hover border-b border-white/5 last:border-0">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="table-data-cell">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={canalColumns.length} className="h-32 text-center text-zinc-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Radio className="w-12 h-12 text-zinc-700" />
                                        <p>Nenhum canal configurado.</p>
                                        <Button onClick={handleAdd} size="sm" className="btn-primary mt-2">
                                            <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Canal
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
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente os canais selecionados.
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
