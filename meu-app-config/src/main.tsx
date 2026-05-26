import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Principal from './components/pages/Principal.tsx';
import PDM from './components/pages/PDM.tsx';
import './index.css'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ProjectProvider } from './context/ProjectContext.tsx';
import { Toaster } from 'react-hot-toast';
import Page from './components/pages/Inicial.tsx';
import Layout from './components/Layout.tsx';
import MAQCanais from './components/pages/MAQCanais.tsx';
import MAQ from './components/pages/MAQ.tsx';
import Inputs from './components/pages/Inputs.tsx';
import CanInputs from './components/pages/CanInputs.tsx';
import SerialMonitor from './components/pages/SerialMonitor.tsx';
import SensorCustomization from './components/pages/SensorCustomization.tsx';
import DashDisplay from './components/pages/DashDisplay.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProjectProvider>
      <HashRouter>
        <Routes>
          {/* Rota inicial sem sidebar */}
          <Route path="/" element={<Page />} />

          {/* Rotas PROTEGIDAS com sidebar fixa */}
          <Route element={<Layout />}>
            <Route path="/principal" element={<Principal />} />
            <Route path="/pdm" element={<PDM />} />
            <Route path="/maq" element={<MAQ />} />
            <Route path="/maq-canais" element={<MAQCanais />} />
            <Route path="/outputs" element={<PDM />} /> {/* Alias PDM to outputs if users try to navigate there directly */}
            <Route path="/inputs" element={<Inputs />} />
            <Route path="/can-inputs" element={<CanInputs />} />
            <Route path="/serial" element={<SerialMonitor />} />
            <Route path="/sensor-customization" element={<SensorCustomization />} />
            <Route path="/dash-display" element={<DashDisplay />} />

          </Route>
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
      </HashRouter>
    </ProjectProvider>
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
