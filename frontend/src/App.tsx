
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SuperUserRoute from './components/SuperUserRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LabList from './pages/LabList';
import LabDetail from './pages/LabDetail';
import ReservationList from './pages/ReservationList';
import AdminPanel from './pages/AdminPanel';
import SuperUserPanel from './pages/SuperUserPanel';
import Layout from './components/Layout';
import { AuthProvider } from './AuthContext';
import { SocketProvider } from './SocketContext';

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="labs" element={<LabList />} />
        <Route path="labs/:labId" element={<LabDetail />} />
        <Route path="reservations" element={<ReservationList />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route
          path="superuser"
          element={
            <SuperUserRoute>
              <SuperUserPanel />
            </SuperUserRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;