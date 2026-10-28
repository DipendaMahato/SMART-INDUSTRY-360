import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AppHeader } from './components/common/AppHeader';
import { AppSidebar } from './components/common/AppSidebar';
import { EmergencyBanner } from './components/common/EmergencyBanner';
import { SimulatorDrawer } from './components/common/SimulatorDrawer';
import { api } from './services/api';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { LoginPage } from './pages/public/LoginPage';

// Worker Mobile Portal
import { WorkerPortalPage } from './pages/worker/WorkerPortalPage';

// Command Center Pages (All 18 Modules)
import { OverviewDashboardPage } from './pages/app/OverviewDashboardPage';
import { LiveMonitoringPage } from './pages/app/LiveMonitoringPage';
import { DigitalTwinPage } from './pages/app/DigitalTwinPage';
import { EquipmentPage } from './pages/app/EquipmentPage';
import { ReportsPage } from './pages/app/ReportsPage';

// Public Shell
const PublicLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Command Center Protected Shell
const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { subscribe } = useWebSocket();
  const [selectedPlantId, setSelectedPlantId] = useState<number>(user?.plant_id || 1);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [criticalCount, setCriticalCount] = useState(0);
  const [unackedCount, setUnackedCount] = useState(0);
  const [latestTitle, setLatestTitle] = useState<string | undefined>(undefined);

  const fetchAlertMetrics = async () => {
    try {
      const incs = await api.getIncidents(selectedPlantId);
      const criticals = incs.filter(
        (i) => i.severity === 'CRITICAL' && ['NEW', 'ACKNOWLEDGED', 'RESPONDING'].includes(i.status)
      );
      setCriticalCount(criticals.length);
      if (criticals.length > 0) {
        setLatestTitle(criticals[0].title);
      } else {
        setLatestTitle(undefined);
      }

      const alts = await api.getAlerts();
      setUnackedCount(alts.filter((a) => a.delivery_status !== 'ACKNOWLEDGED').length);
    } catch (err) {
      // quiet
    }
  };

  useEffect(() => {
    fetchAlertMetrics();
    const unsubInc = subscribe('INCIDENT_CREATED', () => fetchAlertMetrics());
    const unsubIncUp = subscribe('INCIDENT_UPDATED', () => fetchAlertMetrics());
    const unsubAlert = subscribe('ALERT_DISPATCHED', () => fetchAlertMetrics());
    const unsubAck = subscribe('ALERT_ACKNOWLEDGED', () => fetchAlertMetrics());

    const timer = setInterval(fetchAlertMetrics, 6000);
    return () => {
      unsubInc();
      unsubIncUp();
      unsubAlert();
      unsubAck();
      clearInterval(timer);
    };
  }, [selectedPlantId, subscribe]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Authenticating Industrial Command Center...
      </div>
    );
  }

  // If not authenticated, redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Flashing Emergency Banner */}
      <EmergencyBanner criticalCount={criticalCount} latestIncidentTitle={latestTitle} />

      {/* Top Header */}
      <AppHeader
        selectedPlantId={selectedPlantId}
        onSelectPlant={setSelectedPlantId}
        onToggleSimulator={() => setSimulatorOpen(true)}
        unackedCount={unackedCount}
      />

      {/* Body with Collapsible Sidebar & Content */}
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar criticalCount={criticalCount} alertCount={unackedCount} />
        <main className="flex-1 overflow-y-auto bg-slate-950 px-2">
          <Outlet context={{ plantId: selectedPlantId }} />
        </main>
      </div>

      {/* Interactive Simulator Drawer */}
      <SimulatorDrawer
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        onHazardTriggered={fetchAlertMetrics}
      />
    </div>
  );
};

// Route Helpers passing plantId from outlet context
const PlantRoute: React.FC<{ component: React.ComponentType<{ plantId: number }> }> = ({ component: Component }) => {
  const [plantId, setPlantId] = useState(1);
  return <Component plantId={plantId} />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Mobile Worker Portal */}
            <Route path="/worker" element={<WorkerPortalPage />} />

            {/* Command Center Routes (All 18 Modules) */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/overview" replace />} />
              <Route path="overview" element={<PlantRoute component={OverviewDashboardPage} />} />
              <Route path="monitoring" element={<PlantRoute component={LiveMonitoringPage} />} />
              <Route path="digital-twin" element={<PlantRoute component={DigitalTwinPage} />} />
              <Route path="equipment" element={<PlantRoute component={EquipmentPage} />} />
              <Route path="reports" element={<PlantRoute component={ReportsPage} />} />
              <Route path="*" element={<Navigate to="/app/overview" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default App;

