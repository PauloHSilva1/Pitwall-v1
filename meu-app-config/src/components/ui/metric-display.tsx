import { motion } from "framer-motion";

interface MetricDisplayProps {
    label: string;
    value: number;
    unit?: string;
    max?: number;
    showProgress?: boolean;
    status?: "healthy" | "warning" | "critical";
}

const statusColors = {
    healthy: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
};

export function MetricDisplay({
    label,
    value,
    unit,
    max,
    showProgress = false,
    status = "healthy",
}: MetricDisplayProps) {
    const percentage = max ? (value / max) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between">
                <span className="text-sm text-zinc-400 uppercase tracking-wide">
                    {label}
                </span>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono-data text-zinc-100">
                        {value}
                    </span>
                    {unit && (
                        <span className="text-xs text-zinc-500">{unit}</span>
                    )}
                </div>
            </div>

            {showProgress && max && (
                <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`h-full ${statusColors[status]} rounded-full`}
                    />
                </div>
            )}
        </div>
    );
}
