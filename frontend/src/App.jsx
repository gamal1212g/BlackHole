import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';
import RegisterPage from './pages/RegisterPage';
import ReportsPage from './pages/ReportsPage';
import FirewallRulesPage from './pages/FirewallRulesPage';
import AgentFleetPage from './pages/AgentFleetPage';
import SettingsPage from './pages/SettingsPage';
import DocsPage from './pages/DocsPage';
import { useSecurityStore } from './store/useSecurityStore';
import { Cpu } from 'lucide-react';
function ConsoleApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { connectWebSocket, fetchAlerts, fetchConfig, startPolling } = useSecurityStore();
  useEffect(() => {
    fetchAlerts();
    connectWebSocket();
    const stopPolling = startPolling();
    return () => stopPolling();
  }, [fetchAlerts, fetchConfig, connectWebSocket, startPolling]);
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'alerts' && <AlertsPage />}
      {activeTab === 'reports' && <ReportsPage />}
      {activeTab === 'firewall' && <FirewallRulesPage />}
      {activeTab === 'agents' && <AgentFleetPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </Layout>
  );
}
function LandingWrapper() {
  const navigate = useNavigate();
  return <LandingPage onEnter={() => navigate('/console')} />;
}
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingWrapper />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/console" element={<ConsoleApp />} />
      </Routes>
    </Router>
  );
}
export default App;