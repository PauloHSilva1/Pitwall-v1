import React from "react";
import { useProject } from "@/context/ProjectContext";
import { inputColumns, PDMInput } from "../data/PDMColumns";
import { ColumnDef } from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
} from "@/components/ui/menubar"
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { MetricDisplay } from "@/components/ui/metric-display";
import { Plus, Trash2, Cable, Plug, Activity } from "lucide-react";
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

export default function Inputs() {
    const { projectData, setProjectData } = useProject();
    const navigate = useNavigate();

    const [rowSelection, setRowSelection] = React.useState({});
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const rawInputs = React.useMemo(() => {
        return projectData?.config?.PDM?.inputs || {};
    }, [projectData]);

    const data = React.useMemo(() => Object.values(rawInputs) as PDMInput[], [rawInputs]);

    // Calculate stats
    const stats = React.useMemo(() => {
        const configured = data.filter(i => i.source && i.source !== "").length;
        const withPin = data.filter(i => i.pin && i.pin !== "").length;

        return {
            total: data.length,
            configured,
            withPin,
        };
    }, [data]);

    const handleDelete = () => {
        if (!projectData) return;

        const idsToDelete = Object.keys(rowSelection);
        if (idsToDelete.length === 0) return;

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        const inputs = newProjectData.config.PDM.inputs;

        Object.keys(inputs).forEach(key => {
            if (idsToDelete.includes(inputs[key].id)) {
                delete inputs[key];
            }
        });

        setProjectData(newProjectData);
        setRowSelection({});
        setDeleteDialogOpen(false);
        toast.success(`${idsToDelete.length} entrada(s) removida(s)`);
    };

    const updateData = (rowIndex: number, columnId: string, value: any) => {
        if (!projectData) return;

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        const inputs = newProjectData.config.PDM.inputs;

        const rowId = data[rowIndex].id;
        const inputKey = Object.keys(inputs).find(key => inputs[key].id === rowId);

        if (inputKey) {
            inputs[inputKey] = {
                ...inputs[inputKey],
                [columnId]: value
            };
            setProjectData(newProjectData);
        }
    };

    const tableColumns = React.useMemo<ColumnDef<PDMInput>[]>(() => {
        return inputColumns.map(col => {
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

                    return (
                        <input
                            className="bg-transparent border border-transparent hover:border-zinc-700/50 focus:border-red-500 text-zinc-100 text-sm rounded px-2 py-1.5 w-full outline-none transition-smooth"
                            value={value as string}
                            onChange={e => setValue(e.target.value)}
                            onBlur={onBlur}
                        />
                    );
                },
            };
        });
    }, [updateData]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row.id,
        enableRowSelection: true,
        enableMultiRowSelection: true,
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection,
        },
    });

    const handleAdd = () => {
        if (!projectData) return;

        const newId = (Math.max(...Object.keys(rawInputs).map(Number).filter(n => !isNaN(n)), 0) + 1).toString();

        const newInput = {
            id: newId,
            name: `Novo Input ${newId}`,
            source: "",
            pin: ""
        };

        const newProjectData = JSON.parse(JSON.stringify(projectData));
        newProjectData.config.PDM.inputs = {
            ...newProjectData.config.PDM.inputs,
            [newId]: newInput
        };

        setProjectData(newProjectData);
        toast.success("Nova entrada criada");
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
                <h1 className="text-3xl font-bold text-zinc-100">Power Distribution Module</h1>
                <p className="text-zinc-400">Configuração de entradas digitais e analógicas</p>
            </motion.div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusCard
                    title="Entradas Totais"
                    value={stats.total}
                    icon={Plug}
                    status={stats.total > 0 ? "success" : "warning"}
                    subtitle="Inputs configurados"
                />
                <StatusCard
                    title="Com Source"
                    value={`${stats.configured}/${stats.total}`}
                    icon={Cable}
                    status={stats.configured === stats.total ? "success" : "warning"}
                    subtitle="Source definido"
                />
                <StatusCard
                    title="Com Pin"
                    value={`${stats.withPin}/${stats.total}`}
                    icon={Activity}
                    status={stats.withPin === stats.total ? "success" : "warning"}
                    subtitle="Pino configurado"
                />
            </div>

            {/* Metrics Panel */}
            {stats.total > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="panel-elevated p-6"
                >
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
                        Status de Configuração
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MetricDisplay
                            label="Inputs Configurados"
                            value={stats.configured}
                            max={stats.total}
                            showProgress
                            status={stats.configured === stats.total ? "healthy" : "warning"}
                        />
                        <MetricDisplay
                            label="Pins Definidos"
                            value={stats.withPin}
                            max={stats.total}
                            showProgress
                            status={stats.withPin === stats.total ? "healthy" : "warning"}
                        />
                    </div>
                </motion.div>
            )}

            {/* Tabs + Actions */}
            <div className="flex justify-between items-center">
                <Menubar className="border-white/10 bg-zinc-900/50">
                    <MenubarMenu>
                        <MenubarTrigger className="text-zinc-400 hover:text-zinc-100" onClick={() => navigate("/pdm")}>Outputs</MenubarTrigger>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger className="text-red-500 font-semibold" onClick={() => navigate("/inputs")}>Inputs</MenubarTrigger>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger className="text-zinc-400 hover:text-zinc-100" onClick={() => navigate("/can-inputs")}>CAN Inputs</MenubarTrigger>
                    </MenubarMenu>
                </Menubar>

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
                                <TableCell colSpan={inputColumns.length} className="h-32 text-center text-zinc-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Plug className="w-12 h-12 text-zinc-700" />
                                        <p>Nenhuma entrada configurada.</p>
                                        <Button onClick={handleAdd} size="sm" className="btn-primary mt-2">
                                            <Plus className="mr-2 h-4 w-4" /> Criar Primeira Entrada
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
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente as entradas selecionadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-white/10 text-zinc-300 hover:bg-zinc-700">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}