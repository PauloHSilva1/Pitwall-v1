import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatusCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    status?: "success" | "warning" | "error" | "info";
    trend?: string;
    subtitle?: string;
}

const statusColors = {
    success: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
    warning: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
    error: "from-red-500/20 to-red-600/5 border-red-500/30",
    info: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
};

const iconColors = {
    success: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-red-400",
    info: "text-blue-400",
};

export function StatusCard({
    title,
    value,
    icon: Icon,
    status = "info",
    trend,
    subtitle,
}: StatusCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 backdrop-blur-sm shadow-xl transition-all ${statusColors[status]}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-2">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-bold text-zinc-100 font-mono-data">
                            {value}
                        </h3>
                        {trend && (
                            <span className="text-sm text-zinc-500">{trend}</span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-zinc-500 mt-2">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-lg bg-zinc-900/50 ${iconColors[status]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </motion.div>
    );
}
