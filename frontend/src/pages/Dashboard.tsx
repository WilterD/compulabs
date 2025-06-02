import React, { useState, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { useAuth } from '../AuthContext';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [stats, setStats] = useState({
    totalLabs: 0,
    availableComputers: 0,
    totalReservations: 0,
    upcomingReservations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obtener estadísticas de laboratorios
        const labsResponse = await axios.get('http://localhost:5000/api/labs');
        
        // Obtener computadoras disponibles
        const computersResponse = await axios.get('http://localhost:5000/api/computers/available');
        
        // Obtener reservas del usuario
        const reservationsResponse = await axios.get('http://localhost:5000/api/reservations');
        
        // Filtrar reservas próximas (futuras)
        const now = new Date();
        const upcomingReservations = reservationsResponse.data.filter(
          (reservation: any) => new Date(reservation.start_time) > now
        );
        
        setStats({
          totalLabs: labsResponse.data.length,
          availableComputers: computersResponse.data.length,
          totalReservations: reservationsResponse.data.length,
          upcomingReservations: upcomingReservations.length
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Escuchar actualizaciones en tiempo real
    if (socket) {
      socket.on('computer_status_update', () => {
        // Actualizar computadoras disponibles cuando cambie el estado
        axios.get('http://localhost:5000/api/computers/available')
          .then(response => {
            setStats(prev => ({
              ...prev,
              availableComputers: response.data.length
            }));
          })
          .catch(err => console.error('Error al actualizar computadoras disponibles:', err));
      });
      
      socket.on('reservation_update', () => {
        // Actualizar reservas cuando haya cambios
        axios.get('http://localhost:5000/api/reservations')
          .then(response => {
            const now = new Date();
            const upcomingReservations = response.data.filter(
              (reservation: any) => new Date(reservation.start_time) > now
            );
            
            setStats(prev => ({
              ...prev,
              totalReservations: response.data.length,
              upcomingReservations: upcomingReservations.length
            }));
          })
          .catch(err => console.error('Error al actualizar reservas:', err));
      });
    }
    
    return () => {
      if (socket) {
        socket.off('computer_status_update');
        socket.off('reservation_update');
      }
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p className="mt-2">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bienvenido, {user?.first_name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta de Laboratorios */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Laboratorios</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalLabs}</p>
            </div>
          </div>
        </div>
        
        {/* Tarjeta de Computadoras Disponibles */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Computadoras Disponibles</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.availableComputers}</p>
            </div>
          </div>
        </div>
        
        {/* Tarjeta de Reservas Totales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Mis Reservas</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalReservations}</p>
            </div>
          </div>
        </div>
        
        {/* Tarjeta de Reservas Próximas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm font-medium">Reservas Próximas</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.upcomingReservations}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Estado de la conexión en tiempo real</h2>
        <div className={`inline-flex items-center px-4 py-2 rounded-full ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <span className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {connected ? 'Conectado' : 'Desconectado'}
        </div>
        <p className="mt-2 text-gray-600">
          {connected 
            ? 'Estás recibiendo actualizaciones en tiempo real sobre la disponibilidad de computadoras.' 
            : 'No estás recibiendo actualizaciones en tiempo real. Intenta recargar la página.'}
        </p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a href="/labs" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="font-medium text-lg text-blue-600">Ver laboratorios</h3>
            <p className="text-gray-600 mt-1">Explora los laboratorios disponibles y sus computadoras</p>
          </a>
          <a href="/reservations" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="font-medium text-lg text-blue-600">Mis reservas</h3>
            <p className="text-gray-600 mt-1">Gestiona tus reservas actuales y pasadas</p>
          </a>
          <a href="/labs" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="font-medium text-lg text-blue-600">Nueva reserva</h3>
            <p className="text-gray-600 mt-1">Reserva una computadora para tu próxima sesión</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
