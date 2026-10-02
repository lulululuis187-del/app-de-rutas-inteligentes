import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppShell from './components/AppShell';
import PWABadge from './PWABadge';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import RouteDetailPage from './pages/RouteDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import AlertsPage from './pages/AlertsPage';
import LinesPage from './pages/LinesPage';
import PortalPage from './pages/PortalPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/ingresar" element={<AuthPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/resultados" element={<ResultsPage />} />
            <Route path="/ruta/:id" element={<RouteDetailPage />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/alertas" element={<AlertsPage />} />
            <Route path="/lineas" element={<LinesPage />} />
            <Route path="/portal" element={<PortalPage />} />
            <Route path="/ajustes" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PWABadge />
      </BrowserRouter>
    </AuthProvider>
  );
}
