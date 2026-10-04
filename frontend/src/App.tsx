import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Machines } from './pages/Machines';
import { MachineDetails } from './pages/MachineDetails';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { AlertsPage } from './pages/Alerts';
import { MaintenancePage } from './pages/Maintenance';
import { SimulationPage } from './pages/Simulation';
import { SettingsPage } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="machines" element={<Machines />} />
            <Route path="machines/:machine_id" element={<MachineDetails />} />
            <Route path="live" element={<LiveMonitoring />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="simulation" element={<SimulationPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};
export default App;
