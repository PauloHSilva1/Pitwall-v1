// src/components/pages/pdm-columns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"

// Output Type
export type PDMOutput = {
  id: string
  nome: string
  pin: string
  rating: number
  control: string
  maxCurrente: number
  retryDelay: number
  retryCount: number
  settlingTime: number
}

// Input Type
export type PDMInput = {
  id: string
  name: string
  source: string
  pin: string
}

// CAN Input Type
export type PDMCanInput = {
  id: string
  name: string
  source: string
  canId: string
  canType: string
  offset: number
}

// Columns for Outputs
export const columns: ColumnDef<PDMOutput>[] = [
  {
    id: "select",
    header: ({ table }) => null,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  { accessorKey: "id", header: "ID" },
  { accessorKey: "nome", header: "Nome" },
  { accessorKey: "pin", header: "Pino" },
  { accessorKey: "control", header: "Controle" },
  { accessorKey: "rating", header: "Rating (A)" },
  { accessorKey: "maxCurrente", header: "Corrente Máx (A)" },
  { accessorKey: "retryDelay", header: "Delay (ms)" },
  { accessorKey: "retryCount", header: "Retentativas" },
  { accessorKey: "settlingTime", header: "Settling Time" },
];

// Columns for Inputs
export const inputColumns: ColumnDef<PDMInput>[] = [
  {
    id: "select",
    header: ({ table }) => null,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Nome" },
  { accessorKey: "source", header: "Source" },
  { accessorKey: "pin", header: "Pino" },
];

// Columns for CAN Inputs
export const canInputColumns: ColumnDef<PDMCanInput>[] = [
  {
    id: "select",
    header: ({ table }) => null,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Nome" },
  { accessorKey: "source", header: "Source" },
  { accessorKey: "canId", header: "CAN ID" },
  { accessorKey: "canType", header: "CAN Type" },
  { accessorKey: "offset", header: "Offset" },
];