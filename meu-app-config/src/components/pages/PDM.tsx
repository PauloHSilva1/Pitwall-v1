import React from "react";
import { useProject } from "@/context/ProjectContext";
import { columns, PDMOutput } from "../data/PDMColumns";
import { ColumnDef } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusCard } from "@/components/ui/status-card";
import { MetricDisplay } from "@/components/ui/metric-display";
import { Plus, Trash2, Zap, Activity, AlertCircle, Search } from "lucide-react";
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

const numericColumns = ['rating', 'maxCurrente', 'retryDelay', 'retryCount', 'settlingTime'];

export default function PDM() {
  const { projectData, setProjectData } = useProject();
  const navigate = useNavigate();
  const [rowSelection, setRowSelection] = React.useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const rawOutputs = React.useMemo(() => {
    return projectData?.config?.PDM?.output || {};
  }, [projectData]);

  const data = React.useMemo(() => Object.values(rawOutputs) as PDMOutput[], [rawOutputs]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalCurrent = data.reduce((sum, output) => sum + (output.maxCurrente || 0), 0);
    const totalRating = data.reduce((sum, output) => sum + (output.rating || 0), 0);
    const configured = data.filter(o => o.control && o.control !== " ").length;

    return {
      total: data.length,
      configured,
      totalCurrent,
      totalRating,
    };
  }, [data]);

  const handleDelete = () => {
    if (!projectData) return;

    const idsToDelete = Object.keys(rowSelection);
    if (idsToDelete.length === 0) return;

    const newProjectData = JSON.parse(JSON.stringify(projectData));
    const outputs = newProjectData.config.PDM.output;

    Object.keys(outputs).forEach(key => {
      if (idsToDelete.includes(outputs[key].id)) {
        delete outputs[key];
      }
    });

    setProjectData(newProjectData);
    setRowSelection({});
    setDeleteDialogOpen(false);
    toast.success(`${idsToDelete.length} saída(s) removida(s)`);
  };

  const updateData = (rowIndex: number, columnId: string, value: any) => {
    if (!projectData) return;

    const newProjectData = JSON.parse(JSON.stringify(projectData));
    const outputs = newProjectData.config.PDM.output;
    const rowId = data[rowIndex].id;
    const outputKey = Object.keys(outputs).find(key => outputs[key].id === rowId);

    if (outputKey) {
      let finalValue = value;
      if (numericColumns.includes(columnId)) {
        finalValue = Number(value);
      }

      outputs[outputKey] = {
        ...outputs[outputKey],
        [columnId]: finalValue
      };

      setProjectData(newProjectData);
    }
  };

  const tableColumns = React.useMemo<ColumnDef<PDMOutput>[]>(() => {
    return columns.map(col => {
      const column = col as any;
      if (column.id === 'select' || column.accessorKey === 'id') return col;

      const isNumeric = numericColumns.includes(column.accessorKey);

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

          const isInvalid = tableCol.id === 'pin' && (value === " " || value === "");

          return (
            <input
              className={`bg-transparent border border-transparent hover:border-zinc-700/50 focus:border-red-500 text-sm rounded px-2 py-1.5 w-full outline-none transition-smooth ${isNumeric ? 'font-mono-data text-right' : 'text-zinc-100'} ${isInvalid ? 'border-red-500/50 focus:border-red-500 bg-red-950/20' : ''}`}
              value={value as string}
              onChange={e => setValue(e.target.value)}
              onBlur={onBlur}
              type={isNumeric ? "number" : "text"}
            />
          );
        },
      };
    });
  }, [updateData]);

  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      globalFilter,
    },
    meta: {
      updateData
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const safeValue = filterValue.toLowerCase();
      const id = (row.getValue("id") as string)?.toLowerCase() || "";
      const nome = (row.getValue("nome") as string)?.toLowerCase() || "";
      const pin = (row.original as any).pin?.toLowerCase() || "";

      return id.includes(safeValue) || nome.includes(safeValue) || pin.includes(safeValue);
    }
  });

  const handleAdd = () => {
    if (!projectData) return;

    const newId = (Math.max(...Object.keys(rawOutputs).map(Number).filter(n => !isNaN(n)), 0) + 1).toString();

    const newOutput = {
      id: newId,
      nome: `Saída ${newId}`,
      pin: " ",
      rating: 0,
      control: " ",
      maxCurrente: 0,
      retryDelay: 0,
      retryCount: 0,
      settlingTime: 0
    };

    const newProjectData = JSON.parse(JSON.stringify(projectData));
    newProjectData.config.PDM.output = {
      ...newProjectData.config.PDM.output,
      [newId]: newOutput
    };

    setProjectData(newProjectData);
    toast.success("Nova saída PDM criada");
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
        <p className="text-zinc-400">Configuração de saídas e controles de potência</p>
      </motion.div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Saídas Totais"
          value={stats.total}
          icon={Zap}
          status={stats.total > 0 ? "success" : "warning"}
          subtitle="Outputs configurados"
        />
        <StatusCard
          title="Configuradas"
          value={`${stats.configured}/${stats.total}`}
          icon={Activity}
          status={stats.configured === stats.total ? "success" : "warning"}
          subtitle="Com controle definido"
        />
        <StatusCard
          title="Corrente Total"
          value={`${stats.totalCurrent}A`}
          icon={Zap}
          status={stats.totalCurrent > 100 ? "warning" : "success"}
          subtitle="Capacidade máxima"
        />
        <StatusCard
          title="Rating Total"
          value={`${stats.totalRating}A`}
          icon={AlertCircle}
          status={stats.totalRating > 80 ? "warning" : "success"}
          subtitle="Soma dos ratings"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricDisplay
              label="Outputs"
              value={stats.total}
              max={20}
              showProgress
              status={stats.total > 15 ? "warning" : "healthy"}
            />
            <MetricDisplay
              label="Corrente Máxima"
              value={stats.totalCurrent}
              unit="A"
              max={150}
              showProgress
              status={stats.totalCurrent > 120 ? "critical" : "healthy"}
            />
            <MetricDisplay
              label="Rating Total"
              value={stats.totalRating}
              unit="A"
              max={120}
              showProgress
              status={stats.totalRating > 100 ? "warning" : "healthy"}
            />
          </div>
        </motion.div>
      )}

      {/* Tabs + Actions */}
      <div className="flex justify-between items-center">
        <Menubar className="border-white/10 bg-zinc-900/50">
          <MenubarMenu>
            <MenubarTrigger
              className="text-red-500 font-semibold data-[state=open]:bg-zinc-800"
              onClick={() => navigate("/pdm")}
            >
              Outputs
            </MenubarTrigger>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger
              className="text-zinc-400 hover:text-zinc-100 data-[state=open]:bg-zinc-800"
              onClick={() => navigate("/inputs")}
            >
              Inputs
            </MenubarTrigger>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger
              className="text-zinc-400 hover:text-zinc-100 data-[state=open]:bg-zinc-800"
              onClick={() => navigate("/can-inputs")}
            >
              CAN Inputs
            </MenubarTrigger>
          </MenubarMenu>
        </Menubar>

        <div className="flex justify-between items-center gap-2 flex-1 ml-4 justify-end">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar outputs..."
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
            <Button
              onClick={handleAdd}
              className="btn-primary"
            >
              <Plus className="mr-2 h-4 w-4" /> Novo
            </Button>
          </div>
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
                  <TableHead
                    key={header.id}
                    className="table-header-cell"
                  >
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
                    <TableCell
                      key={cell.id}
                      className="table-data-cell"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-zinc-500">
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="w-12 h-12 text-zinc-700" />
                    <p>Nenhuma saída configurada.</p>
                    <Button onClick={handleAdd} size="sm" className="btn-primary mt-2">
                      <Plus className="mr-2 h-4 w-4" /> Criar Primeira Saída
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente as saídas selecionadas.
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