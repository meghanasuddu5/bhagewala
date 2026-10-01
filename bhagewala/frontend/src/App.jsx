import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import DataProvenanceModal from './components/DataProvenanceModal';
import GuidedDemoTour from './components/GuidedDemoTour';
import IntegratedTwinPage from './pages/IntegratedTwinPage';
import OverviewPage from './pages/OverviewPage';
import ReservoirPage from './pages/ReservoirPage';
import SteamThermalPage from './pages/SteamThermalPage';
import WellPumpPage from './pages/WellPumpPage';
import ForecastPage from './pages/ForecastPage';
import ScenarioLabPage from './pages/ScenarioLabPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ModelInfoPage from './pages/ModelInfoPage';
import { fetchHealth, fetchDigitalTwinState, fetchModelInfo, DEFAULT_TWIN_STATE } from './api';

export default function App() {
  const [activePage, setActivePage] = useState('integrated-twin');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedWell, setSelectedWell] = useState('BW-01');
  const [health, setHealth] = useState(null);
  const [twinState, setTwinState] = useState(DEFAULT_TWIN_STATE);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isProvenanceOpen, setIsProvenanceOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [healthData, stateData, infoData] = await Promise.all([
        fetchHealth(),
        fetchDigitalTwinState(),
        fetchModelInfo()
      ]);
      setHealth(healthData);
      if (stateData) setTwinState(stateData);
      setModelInfo(infoData);
    } catch (err) {
      console.error("Error loading twin state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-collapse sidebar on Integrated Twin page to prioritize 3D viewport (>70% screen)
  useEffect(() => {
    if (activePage === 'integrated-twin') {
      setIsSidebarCollapsed(true);
    }
  }, [activePage]);

  return (
    <div className={`digital-twin-layout ${isSidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Persistent 8-Section Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Workspace Area */}
      <div className="main-workspace">
        {/* Persistent Top Navigation Bar */}
        <TopNav
          health={health}
          loading={loading}
          onRefresh={loadData}
          selectedWell={selectedWell}
          setSelectedWell={setSelectedWell}
          onStartDemo={() => setIsTourActive(true)}
          onOpenProvenance={() => setIsProvenanceOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Dynamic Page Router */}
        <main className="page-content-wrapper">
          {activePage === 'integrated-twin' && (
            <IntegratedTwinPage
              onNavigateDetail={(page) => setActivePage(page)}
            />
          )}

          {activePage === 'overview' && (
            <OverviewPage
              twinState={twinState}
              onNavigate={(page) => setActivePage(page)}
            />
          )}

          {activePage === 'reservoir' && (
            <ReservoirPage twinState={twinState} />
          )}

          {activePage === 'steam' && (
            <SteamThermalPage twinState={twinState} />
          )}

          {activePage === 'well' && (
            <WellPumpPage twinState={twinState} />
          )}

          {activePage === 'forecast' && (
            <ForecastPage twinState={twinState} health={health} />
          )}

          {activePage === 'scenarios' && (
            <ScenarioLabPage twinState={twinState} />
          )}

          {activePage === 'analytics' && (
            <AnalyticsPage />
          )}

          {activePage === 'model-info' && (
            <ModelInfoPage modelInfo={modelInfo} />
          )}
        </main>
      </div>

      {/* Global Data Provenance Modal */}
      <DataProvenanceModal
        isOpen={isProvenanceOpen}
        onClose={() => setIsProvenanceOpen(false)}
      />

      {/* Global Guided Demo Tour Bar */}
      <GuidedDemoTour
        isActive={isTourActive}
        onClose={() => setIsTourActive(false)}
        onNavigate={(page) => setActivePage(page)}
      />
    </div>
  );
}
