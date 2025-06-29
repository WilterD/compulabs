// React import is handled by JSX transform
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { SocketProvider } from './SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LabList from './pages/LabList';
import LabDetail from './pages/LabDetail';
import ReservationList from './pages/ReservationList';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import SuperUserPanel from './pages/SuperUserPanel';
import SuperUserRoute from './components/SuperUserRoute';
import './App.css'; // Import global styles

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="labs" element={<LabList />} />
              <Route path="labs/:labId" element={<LabDetail />} />
              <Route path="reservations" element={<ReservationList />} />
              <Route path="admin" element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              } />
              <Route path="superuser" element={
                <SuperUserRoute>
                  <SuperUserPanel />
                </SuperUserRoute>
              } />

            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
