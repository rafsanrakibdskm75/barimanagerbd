import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { getTheme } from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import Layout from './components/Layout';
import PremiumLoader from './components/PremiumLoader';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Houses from './pages/Houses';
import Flats from './pages/Flats';
import Tenants from './pages/Tenants';
import Meter from './pages/Meter';
import MeterHistory from './pages/MeterHistory';
import Collections from './pages/Collections';
import History from './pages/History';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PremiumLoader fullScreen />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/houses" element={<Houses />} />
        <Route path="/flats" element={<Flats />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/meter" element={<Meter />} />
        <Route path="/meter-history" element={<MeterHistory />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/history" element={<History />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function AppContent() {
  const { settings } = useSettings();
  const themeMode = settings?.theme_mode || 'light';
  const activeTheme = getTheme(themeMode);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
