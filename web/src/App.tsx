import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LanguageProvider } from './i18n/LanguageContext';
import { AdminPage } from './pages/AdminPage';
import { CargoPage } from './pages/CargoPage';
import { ContainersPage } from './pages/ContainersPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventLogsPage } from './pages/EventLogsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { LoginPage } from './pages/LoginPage';
import { ShipmentDetailsPage } from './pages/ShipmentDetailsPage';
import { ShipmentsPage } from './pages/ShipmentsPage';

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={(
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              )}
            >
              <Route index element={<DashboardPage />} />
              <Route path="shipments" element={<ShipmentsPage />} />
              <Route path="shipments/:id" element={<ShipmentDetailsPage />} />
              <Route path="cargo" element={<CargoPage />} />
              <Route path="containers" element={<ContainersPage />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="events" element={<EventLogsPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
