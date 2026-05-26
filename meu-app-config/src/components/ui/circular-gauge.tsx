import { motion } from "framer-motion";

interface CircularGaugeProps {
    value: number;
    max: number;
    label: string;
    unit?: string;
    size?: number;
    strokeWidth?: number;
}

export function CircularGauge({
    value,
    max,
    label,
    unit = "",
    size = 120,
    strokeWidth = 8,
}: CircularGaugeProps) {
    const percentage = (value / max) * 100;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Color based on percentage
    const getColor = () => {
        if (percentage >= 80) return "#EF4444"; // red
        if (percentage >= 60) return "#F59E0B"; // amber
        return "#10B981"; // emerald
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background circle */}
                <svg className="transform -rotate-90" width={size} height={size}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-zinc-800"
                    />
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={getColor()}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold font-mono-data text-zinc-100">
                        {value}
                    </span>
                    {unit && (
                        <span className="text-xs text-zinc-500">{unit}</span>
                    )}
                </div>
            </div>

            <span className="text-sm text-zinc-400 uppercase tracking-wide">
                {label}
            </span>
        </div>
    );
}
