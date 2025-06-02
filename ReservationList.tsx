import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

interface Reservation {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  recurring: boolean;
  recurrence_pattern: string | null;
  user_id: number;
  computer_id: number;
  computer?: {
    name: string;
    hostname: string;
    laboratory_id: number;
  };
  laboratory?: {
    name: string;
    location: string;
  };
}

const ReservationList: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('upcoming');

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/reservations');
        
        // Obtener detalles de computadoras para cada reserva
        const reservationsWithDetails = await Promise.all(
          response.data.map(async (reservation: Reservation) => {
            try {
              const computerResponse = await axios.get(`http://localhost:5000/api/computers/${reservation.computer_id}`);
              const computer = computerResponse.data;
              
              // Obtener detalles del laboratorio
              const labResponse = await axios.get(`http://localhost:5000/api/labs/${computer.laboratory_id}`);
              
              return {
                ...reservation,
                computer: computer,
                laboratory: labResponse.data
              };
            } catch (err) {
              console.error(`Error al obtener detalles para la reserva ${reservation.id}:`, err);
              return reservation;
            }
          })
        );
        
        setReservations(reservationsWithDetails);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar reservas:', err);
        setError('Error al cargar las reservas. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchReservations();

    // Escuchar actualizaciones en tiempo real
    if (socket) {
      socket.on('reservation_update', fetchReservations);
    }

    return () => {
      if (socket) {
        socket.off('reservation_update');
      }
    };
  }, [socket]);

  const handleCancelReservation = async (reservationId: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/reservations/${reservationId}`);
      
      // Actualizar la lista de reservas
      setReservations(prevReservations => 
        prevReservations.filter(reservation => reservation.id !== reservationId)
      );
    } catch (err) {
      console.error('Error al cancelar la reserva:', err);
      setError('Error al cancelar la reserva. Por favor, intenta de nuevo más tarde.');
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const now = new Date();
  
  const upcomingReservations = reservations.filter(
    reservation => new Date(reservation.start_time) > now
  );
  
  const pastReservations = reservations.filter(
    reservation => new Date(reservation.end_time) < now
  );
  
  const currentReservations = reservations.filter(
    reservation => new Date(reservation.start_time) <= now && new Date(reservation.end_time) >= now
  );

  const displayReservations = 
    activeTab === 'upcoming' ? upcomingReservations :
    activeTab === 'past' ? pastReservations :
    currentReservations;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p className="mt-2">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mis Reservas</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Próximas ({upcomingReservations.length})
            </button>
            <button
              onClick={() => setActiveTab('current')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'current'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Actuales ({currentReservations.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pasadas ({pastReservations.length})
            </button>
          </nav>
        </div>
      </div>
      
      {displayReservations.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">No tienes reservas {
            activeTab === 'upcoming' ? 'próximas' :
            activeTab === 'current' ? 'actuales' : 'pasadas'
          }.</span>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {displayReservations.map((reservation) => (
              <li key={reservation.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {reservation.computer?.name || `Computadora #${reservation.computer_id}`}
                      </p>
                      <p className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reservation.status === 'confirmed' ? 'Confirmada' :
                         reservation.status === 'pending' ? 'Pendiente' :
                         reservation.status === 'cancelled' ? 'Cancelada' :
                         reservation.status === 'completed' ? 'Completada' : reservation.status}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      {activeTab === 'upcoming' && (
                        <button
                          onClick={() => handleCancelReservation(reservation.id)}
                          className="ml-2 px-3 py-1 border border-red-300 text-red-700 text-sm rounded-md hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        {reservation.laboratory?.name || 'Laboratorio no especificado'}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        {reservation.laboratory?.location || 'Ubicación no especificada'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <p>
                        {formatDateTime(reservation.start_time)} - {formatDateTime(reservation.end_time)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReservationList;
