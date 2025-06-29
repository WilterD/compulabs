import React from 'react';
import { useAuth } from '../AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface SuperUserRouteProps {
  children?: React.ReactNode;
}

const SuperUserRoute: React.FC<SuperUserRouteProps> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (!isAuthenticated || user?.role !== 'superuser') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default SuperUserRoute;
