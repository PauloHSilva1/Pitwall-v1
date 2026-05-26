import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Activity, LogOut, Cable, Database, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/context/ProjectContext";

export default function Layout() {
  const { projectData, setProjectData } = useProject();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setProjectData(null);
    navigate("/");
  };

  const isActive = (path: string | string[]) => {
    if (Array.isArray(path)) {
      return path.includes(location.pathname);
    }
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden layer-0 text-foreground">
      {/* PROFESSIONAL SIDEBAR */}
      <aside className="w-64 border-r border-white/10 layer-1 flex flex-col shadow-2xl relative">
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/[0.02] via-transparent to-transparent pointer-events-none" />

        {/* Logo Section */}
        <div className="px-6 py-8 border-b border-white/5 relative z-10">
          <h2 className="text-2xl font-black text-red-500 uppercase tracking-tight mb-1">
            Pitwall
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono-data tracking-wider uppercase">
            {projectData?.path.split(/[\\\/]/).pop() || "No Project"}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 relative z-10">
          <Link to="/principal">
            <Button
              variant="ghost"
              className={`w-full justify-start h-10 transition-all duration-200 group ${isActive('/principal')
                  ? 'sidebar-item-active'
                  : 'hover:bg-white/[0.03] text-zinc-300 hover:text-zinc-100'
                }`}
            >
              <LayoutDashboard className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">Principal</span>
            </Button>
          </Link>

          <Link to="/pdm">
            <Button
              variant="ghost"
              className={`w-full justify-start h-10 transition-all duration-200 group ${isActive(['/pdm', '/inputs', '/can-inputs'])
                  ? 'sidebar-item-active'
                  : 'hover:bg-white/[0.03] text-zinc-300 hover:text-zinc-100'
                }`}
            >
              <Activity className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">PDM</span>
            </Button>
          </Link>

          <Link to="/maq">
            <Button
              variant="ghost"
              className={`w-full justify-start h-10 transition-all duration-200 group ${isActive(['/maq', '/maq-canais', '/dash-display'])
                  ? 'sidebar-item-active'
                  : 'hover:bg-white/[0.03] text-zinc-300 hover:text-zinc-100'
                }`}
            >
              <Database className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">MAQ</span>
            </Button>
          </Link>

          <Link to="/serial">
            <Button
              variant="ghost"
              className={`w-full justify-start h-10 transition-all duration-200 group ${isActive('/serial')
                  ? 'sidebar-item-active'
                  : 'hover:bg-white/[0.03] text-zinc-300 hover:text-zinc-100'
                }`}
            >
              <Cable className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">Serial</span>
            </Button>
          </Link>

          <Link to="/sensor-customization">
            <Button
              variant="ghost"
              className={`w-full justify-start h-10 transition-all duration-200 group ${isActive('/sensor-customization')
                  ? 'sidebar-item-active'
                  : 'hover:bg-white/[0.03] text-zinc-300 hover:text-zinc-100'
                }`}
            >
              <Calculator className="mr-3 h-4 w-4" />
              <span className="text-sm font-medium">Sensores</span>
            </Button>
          </Link>
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-white/5 relative z-10">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start h-10 border-white/10 bg-transparent text-zinc-400 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/50 transition-all duration-200"
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="text-sm font-medium">Sair</span>
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}