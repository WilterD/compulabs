import React, { useState, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Reservation {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  computer?: {
    name: string;
    laboratory?: {
      name: string;
    };
  };
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [stats, setStats] = useState({
    totalLabs: 0,
    availableComputers: 0,
    totalReservations: 0,
    upcomingReservations: 0
  });
  
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('📊 Cargando datos del dashboard del estudiante...');

        // Obtener estadísticas generales
        const [labsResponse, computersResponse, reservationsResponse, myReservationsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/labs`),
          axios.get(`${API_BASE_URL}/computers/available`),
          axios.get(`${API_BASE_URL}/reservations`),
          axios.get(`${API_BASE_URL}/reservations/user/${user.id}`)
        ]);

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

        setMyReservations(myReservationsResponse.data);
        setLoading(false);

        console.log('✅ Datos del dashboard cargados exitosamente');
      } catch (err: any) {
        console.error('❌ Error al cargar datos del dashboard:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Error al cargar los datos';
        setError(`${errorMessage}. Por favor, intenta de nuevo más tarde.`);
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Configurar listeners de Socket.IO para actualizaciones en tiempo real
    if (socket && user) {
      console.log('🎯 STUDENT DASHBOARD: Configurando listeners de Socket.IO');
      
      // Escuchar actualizaciones de estado de computadoras
      socket.on('computer_status_updated', (data) => {
        console.log('🎯 STUDENT DASHBOARD: Evento computer_status_updated recibido');
        
        // Actualizar el contador de computadoras disponibles
        axios.get(`${API_BASE_URL}/computers/available`)
          .then(response => {
            setStats(prev => ({
              ...prev,
              availableComputers: response.data.length
            }));
          })
          .catch(err => console.error('❌ Error al actualizar computadoras disponibles:', err));
      });

      // Escuchar actualizaciones de estado de reservas (cuando admin aprueba/cancela)
      socket.on('reservation_status_updated', (data) => {
        console.log('🎯 STUDENT DASHBOARD: Evento reservation_status_updated recibido');
        
        // Solo actualizar si la reserva pertenece al usuario actual
        if (data.user_id === user.id) {
          console.log('   - Reserva pertenece al usuario actual, actualizando...');
          
          // Actualizar mis reservas
          axios.get(`${API_BASE_URL}/reservations/user/${user.id}`)
            .then(response => {
              setMyReservations(response.data);
            })
            .catch(err => console.error('Error al actualizar mis reservas:', err));
          
          // Actualizar contadores de reservas
          axios.get(`${API_BASE_URL}/reservations`)
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
        }
        
        // También actualizar computadoras disponibles
        axios.get(`${API_BASE_URL}/computers/available`)
          .then(response => {
            setStats(prev => ({
              ...prev,
              availableComputers: response.data.length
            }));
          })
          .catch(err => console.error('Error al actualizar computadoras disponibles:', err));
      });

      // Escuchar nuevas reservas
      socket.on('reservation_update', () => {
        console.log('🎯 STUDENT DASHBOARD: Evento reservation_update recibido');
        
        // Actualizar mis reservas
        axios.get(`${API_BASE_URL}/reservations/user/${user.id}`)
          .then(response => {
            setMyReservations(response.data);
          })
          .catch(err => console.error('Error al actualizar mis reservas:', err));
        
        // Actualizar contadores
        axios.get(`${API_BASE_URL}/reservations`)
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
        console.log('StudentDashboard: Limpiando listeners de Socket.IO');
        socket.off('computer_status_updated');
        socket.off('reservation_status_updated');
        socket.off('reservation_update');
      }
    };
  }, [socket, user.id]);

  const formatDateTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tu dashboard...</p>
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Bienvenido, {user.name}</h1>
        <p className="text-gray-600 mt-2">Panel de estudiante - Gestiona tus reservas de computadoras</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Laboratorios Disponibles */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Laboratorios</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalLabs}</p>
            </div>
          </div>
        </div>

        {/* Computadoras Disponibles */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Computadoras Disponibles</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.availableComputers}</p>
            </div>
          </div>
        </div>

        {/* Mis Reservas */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mis Reservas</p>
              <p className="text-2xl font-semibold text-gray-900">{myReservations.length}</p>
            </div>
          </div>
        </div>

        {/* Próximas Reservas */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Próximas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {myReservations.filter(r => new Date(r.start_time) > new Date()).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/labs" className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-md transition duration-200">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold">Ver Laboratorios</h3>
              <p className="text-blue-100">Explora los laboratorios disponibles</p>
            </div>
          </div>
        </Link>

        <Link to="/reservations" className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow-md transition duration-200">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold">Nueva Reserva</h3>
              <p className="text-green-100">Reserva una computadora</p>
            </div>
          </div>
        </Link>

        <Link to="/my-reservations" className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow-md transition duration-200">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold">Mis Reservas</h3>
              <p className="text-purple-100">Gestiona tus reservas</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Mis Reservas Recientes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Mis Reservas Recientes</h2>
        
        {myReservations.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">No tienes reservas aún</p>
            <Link to="/reservations" className="text-blue-600 hover:text-blue-800 font-medium">
              Haz tu primera reserva
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Computadora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Laboratorio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myReservations.slice(0, 5).map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reservation.computer?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reservation.computer?.laboratory?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(reservation.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {myReservations.length > 5 && (
          <div className="mt-4 text-center">
            <Link to="/my-reservations" className="text-blue-600 hover:text-blue-800 font-medium">
              Ver todas mis reservas ({myReservations.length})
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard; 