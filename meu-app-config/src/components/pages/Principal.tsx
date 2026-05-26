import { useProject } from "@/context/ProjectContext";
import { StatusCard } from "@/components/ui/status-card";
import { CircularGauge } from "@/components/ui/circular-gauge";
import { MetricDisplay } from "@/components/ui/metric-display";
import { Button } from "@/components/ui/button";
import {
  Database,
  Activity,
  Cable,
  Zap,
  ArrowRight,
  Settings,
  Play,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

export default function Principal() {
  const { projectData } = useProject();
  const navigate = useNavigate();

  // Calculate statistics from project data
  const stats = useMemo(() => {
    const maqCount = Object.keys(projectData?.config?.MAQ || {}).length;
    const pdmOutputs = Object.keys(projectData?.config?.PDM?.output || {}).length;
    const pdmInputs = Object.keys(projectData?.config?.PDM?.inputs || {}).length;
    const sensors = Object.keys(projectData?.config?.sensores || {}).length;

    // Calculate total frequency from MAQ configs
    const totalFrequency = Object.values(projectData?.config?.MAQ || {}).reduce(
      (sum: number, maq: any) => sum + (maq.frequenciaTotal || 0),
      0
    );

    return {
      maqCount,
      pdmOutputs,
      pdmInputs,
      sensors,
      totalFrequency,
      activeConfigs: maqCount + (pdmOutputs > 0 ? 1 : 0),
    };
  }, [projectData]);

  const quickActions = [
    {
      title: "Configurar MAQ",
      description: "Gerencie módulos de aquisição",
      icon: Database,
      path: "/maq",
      color: "from-blue-500/20 to-blue-600/5",
    },
    {
      title: "Configurar PDM",
      description: "Power Distribution Module",
      icon: Activity,
      path: "/pdm",
      color: "from-purple-500/20 to-purple-600/5",
    },
    {
      title: "Monitor Serial",
      description: "Interface de comunicação",
      icon: Cable,
      path: "/serial",
      color: "from-emerald-500/20 to-emerald-600/5",
    },
    {
      title: "Personalizar Sensores",
      description: "Calibração e curvas",
      icon: Settings,
      path: "/sensor-customization",
      color: "from-amber-500/20 to-amber-600/5",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-zinc-100">
          Dashboard
        </h1>
        <p className="text-zinc-400">
          {projectData?.name || "Projeto Atual"} • {projectData?.path?.split(/[\\\/]/).pop() || "arquivo.cefast"}
        </p>
      </motion.div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatusCard
          title="MAQ Configuradas"
          value={stats.maqCount}
          icon={Database}
          status={stats.maqCount > 0 ? "success" : "warning"}
          subtitle="Módulos de aquisição"
        />

        <StatusCard
          title="Saídas PDM"
          value={stats.pdmOutputs}
          icon={Zap}
          status={stats.pdmOutputs > 0 ? "success" : "info"}
          subtitle="Power outputs ativos"
        />

        <StatusCard
          title="Sensores Configurados"
          value={stats.sensors}
          icon={Activity}
          status={stats.sensors > 1 ? "success" : "warning"}
          subtitle="Tipos disponíveis"
        />
      </div>

      {/* Gauges and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="panel-elevated p-6 space-y-6"
        >
          <h3 className="text-lg font-semibold text-zinc-100 uppercase tracking-wide">
            System Health
          </h3>

          <div className="flex justify-center">
            <CircularGauge
              value={stats.activeConfigs}
              max={10}
              label="Configs Ativas"
              size={140}
            />
          </div>

          <div className="space-y-4">
            <MetricDisplay
              label="MAQ Modules"
              value={stats.maqCount}
              showProgress
              max={6}
              status={stats.maqCount > 0 ? "healthy" : "warning"}
            />
            <MetricDisplay
              label="PDM Outputs"
              value={stats.pdmOutputs}
              showProgress
              max={20}
              status={stats.pdmOutputs > 0 ? "healthy" : "critical"}
            />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="panel-elevated p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-zinc-100 uppercase tracking-wide">
            Status do Sistema
          </h3>

          <div className="space-y-3">
            <ActivityItem
              icon={CheckCircle2}
              status="success"
              text="Projeto carregado com sucesso"
              time="Agora"
            />
            <ActivityItem
              icon={Database}
              status="info"
              text={`${stats.maqCount} módulos MAQ detectados`}
              time="Verificado"
            />
            <ActivityItem
              icon={Activity}
              status={stats.pdmOutputs > 0 ? "success" : "warning"}
              text={`PDM: ${stats.pdmOutputs} saídas configuradas`}
              time="Status atual"
            />
            <ActivityItem
              icon={stats.totalFrequency > 0 ? CheckCircle2 : AlertTriangle}
              status={stats.totalFrequency > 0 ? "success" : "warning"}
              text={`Frequência de amostragem: ${stats.totalFrequency} Hz`}
              time="Telemetria"
            />
          </div>
        </motion.div>

        {/* Configuration Overview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="panel-elevated p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-zinc-100 uppercase tracking-wide">
            Resumo Configurações
          </h3>

          <div className="space-y-3">
            <ConfigItem label="Módulos MAQ" value={stats.maqCount} />
            <ConfigItem label="Saídas PDM" value={stats.pdmOutputs} />
            <ConfigItem label="Entradas PDM" value={stats.pdmInputs} />
            <ConfigItem label="Tipos de Sensores" value={stats.sensors} />
            <ConfigItem label="Freq. Total" value={`${stats.totalFrequency} Hz`} />
          </div>

          <div className="pt-4 border-t border-white/5">
            <Button
              onClick={() => navigate("/maq")}
              className="w-full btn-primary"
            >
              <Settings className="mr-2 h-4 w-4" />
              Gerenciar Configurações
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-100 uppercase tracking-wide">
          Ações Rápidas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${action.color} p-6 text-left transition-all hover:border-white/20 group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-zinc-900/50">
                  <action.icon className="w-6 h-6 text-zinc-300 group-hover:text-white transition-colors" />
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>

              <h4 className="text-lg font-semibold text-zinc-100 mb-1">
                {action.title}
              </h4>
              <p className="text-sm text-zinc-500">
                {action.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      {stats.maqCount === 0 && stats.pdmOutputs === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="panel-elevated p-8 text-center space-y-4"
        >
          <div className="inline-flex p-4 rounded-full bg-amber-500/10">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-100">
            Nenhuma configuração detectada
          </h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            Comece configurando seus módulos MAQ ou PDM para ativar a telemetria do veículo.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/maq")} className="btn-primary">
              <Database className="mr-2 h-4 w-4" />
              Configurar MAQ
            </Button>
            <Button onClick={() => navigate("/pdm")} className="btn-secondary">
              <Activity className="mr-2 h-4 w-4" />
              Configurar PDM
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Helper Components
function ActivityItem({ icon: Icon, status, text, time }: any) {
  const statusColors = {
    success: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-red-400",
    info: "text-blue-400",
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
      <Icon className={`w-5 h-5 mt-0.5 ${statusColors[status]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300">{text}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-sm font-mono-data font-semibold text-zinc-100">
        {value}
      </span>
    </div>
  );
}