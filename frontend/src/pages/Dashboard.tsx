import React from 'react';
import { useAuth } from '../AuthContext';
import AdminPanel from './AdminPanel';
import SuperUserPanel from './SuperUserPanel';
import StudentDashboard from './StudentDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  console.log('Usuario desde contexto:', user);

  // Mostrar mensaje mientras se carga usuario
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  // Mostrar panel del superusuario
  if (user?.role === 'superuser') {
    console.log('Redirigiendo a panel de superusuario');
    return <SuperUserPanel />;
  }

  // Mostrar panel del admin
  if (user.role === 'admin') {
    console.log('Redirigiendo a panel de administrador');
    return <AdminPanel />;
  }

  // Mostrar dashboard del estudiante
  if (user.role === 'student') {
    console.log('Redirigiendo a dashboard del estudiante');
    return <StudentDashboard />;
  }

  // Fallback para otros roles
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Rol no reconocido</h2>
        <p className="text-gray-600">Tu rol ({user.role}) no tiene un dashboard configurado.</p>
        <p className="text-sm text-gray-500 mt-2">Contacta al administrador para configurar tu rol.</p>
      </div>
    </div>
  );
};

export default Dashboard;
