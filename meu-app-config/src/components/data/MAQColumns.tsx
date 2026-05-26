import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"

export type MAQConfig = {
    id: string
    nome: string
    veiculo: string
    dataLogger: string
    velocidade: string
    temperatura: string
    lapTimer: string
    frequenciaTotal: number
    canais: Canal[]
}

export type Canal = {
    id: string
    ativado: number
    nome: string
    frequencia: string
    tipo: string
    unidade: string
    escalaBaixa: string
    escalaAlta: string
    sensor: {
        a0: number
        a1: number
        a2: number
        a3: number
    }
}


export const columns: ColumnDef<MAQConfig>[] = [
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
    { accessorKey: "veiculo", header: "Veículo" },
    { accessorKey: "dataLogger", header: "Data Logger" },
    { accessorKey: "velocidade", header: "Velocidade" },
    { accessorKey: "temperatura", header: "Temperatura" },
    { accessorKey: "lapTimer", header: "Lap Timer" },
    { accessorKey: "frequenciaTotal", header: "Frequência (Hz)" },
];

export const canalColumns: ColumnDef<Canal>[] = [
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
    {
        accessorKey: "ativado",
        header: "Ativado",
        cell: ({ row }) => (
            <Checkbox
                checked={row.original.ativado === 1}
                disabled
                aria-label="Channel enabled"
            />
        )
    },
    { accessorKey: "nome", header: "Nome" },
    { accessorKey: "frequencia", header: "Frequência" },
    { accessorKey: "tipo", header: "Tipo" },
    { accessorKey: "unidade", header: "Unidade" },
    { accessorKey: "escalaBaixa", header: "Escala Baixa" },
    { accessorKey: "escalaAlta", header: "Escala Alta" },
];
