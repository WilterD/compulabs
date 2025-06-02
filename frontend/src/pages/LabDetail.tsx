import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../SocketContext';
import { useAuth } from '../AuthContext';

interface Computer {
  id: number;
  name: string;
  hostname: string;
  specs: string;
  status: string;
  laboratory_id: number;
}

interface Lab {
  id: number;
  name: string;
  location: string;
  capacity: number;
  description: string;
  opening_time: string;
  closing_time: string;
}

interface ReservationFormData {
  start_time: string;
  end_time: string;
  computer_id: number;
}

const LabDetail: React.FC = () => {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user: _ } = useAuth(); // Usando destructuring con renombre para evitar advertencia
  
  const [lab, setLab] = useState<Lab | null>(null);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const [showReservationForm, setShowReservationForm] = useState<boolean>(false);
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [reservationData, setReservationData] = useState<ReservationFormData>({
    start_time: '',
    end_time: '',
    computer_id: 0
  });
  const [reservationError, setReservationError] = useState<string>('');
  const [reservationSuccess, setReservationSuccess] = useState<string>('');

  useEffect(() => {
    const fetchLabDetails = async () => {
      try {
        // Obtener detalles del laboratorio
        const labResponse = await axios.get(`http://localhost:5000/api/labs/${labId}`);
        setLab(labResponse.data);
        
        // Obtener computadoras del laboratorio
        const computersResponse = await axios.get(`http://localhost:5000/api/computers/laboratory/${labId}`);
        setComputers(computersResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar detalles del laboratorio:', err);
        setError('Error al cargar los detalles del laboratorio. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchLabDetails();

    // Escuchar actualizaciones en tiempo real
    if (socket) {
      socket.on('computer_status_update', fetchLabDetails);
    }

    return () => {
      if (socket) {
        socket.off('computer_status_update');
      }
    };
  }, [labId, socket]);

  const handleReservationClick = (computer: Computer) => {
    setSelectedComputer(computer);
    setReservationData({
      start_time: '',
      end_time: '',
      computer_id: computer.id
    });
    setShowReservationForm(true);
    setReservationError('');
    setReservationSuccess('');
  };

  const handleReservationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReservationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReservationError('');
    setReservationSuccess('');

    try {
      await axios.post('http://localhost:5000/api/reservations', reservationData);
      setReservationSuccess('Reserva creada exitosamente');
      setShowReservationForm(false);
      
      // Actualizar la lista de computadoras
      const computersResponse = await axios.get(`http://localhost:5000/api/computers/laboratory/${labId}`);
      setComputers(computersResponse.data);
    } catch (err: any) {
      setReservationError('Error al crear la reserva: ' + (err.response?.data?.message || 'Verifica los datos ingresados'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p className="mt-2">Cargando detalles del laboratorio...</p>
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
      <button 
        onClick={() => navigate('/labs')}
        className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Volver a Laboratorios
      </button>

      {lab && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{lab.name}</h1>
          <p className="text-gray-600 mt-2">{lab.description || 'Sin descripción'}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>{lab.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Horario: {lab.opening_time} - {lab.closing_time}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              <span>Capacidad: {lab.capacity} computadoras</span>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Computadoras Disponibles</h2>
      
      {computers.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">No hay computadoras disponibles en este laboratorio.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {computers.map((computer) => (
            <div 
              key={computer.id} 
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                computer.status === 'available' ? 'border-l-4 border-green-500' : 
                computer.status === 'maintenance' ? 'border-l-4 border-yellow-500' : 
                'border-l-4 border-red-500'
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800">{computer.name}</h3>
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      computer.status === 'available' ? 'bg-green-100 text-green-800' : 
                      computer.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {computer.status === 'available' ? 'Disponible' : 
                     computer.status === 'maintenance' ? 'En mantenimiento' : 
                     'Reservada'}
                  </span>
                </div>
                
                <p className="text-gray-600 mt-2">Hostname: {computer.hostname}</p>
                <p className="text-gray-600 mt-1">
                  Especificaciones: {computer.specs ? JSON.parse(computer.specs).description || 'No especificado' : 'No especificado'}
                </p>
                
                {computer.status === 'available' && (
                  <button
                    onClick={() => handleReservationClick(computer)}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                  >
                    Reservar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Reserva */}
      {showReservationForm && selectedComputer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Reservar Computadora</h2>
            <p className="text-gray-600 mb-4">Estás reservando: <strong>{selectedComputer.name}</strong></p>
            
            {reservationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{reservationError}</span>
              </div>
            )}
            
            {reservationSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{reservationSuccess}</span>
              </div>
            )}
            
            <form onSubmit={handleReservationSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="start_time">
                  Fecha y hora de inicio
                </label>
                <input
                  type="datetime-local"
                  id="start_time"
                  name="start_time"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                  value={reservationData.start_time}
                  onChange={handleReservationChange}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end_time">
                  Fecha y hora de fin
                </label>
                <input
                  type="datetime-local"
                  id="end_time"
                  name="end_time"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                  value={reservationData.end_time}
                  onChange={handleReservationChange}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowReservationForm(false)}
                  className="mr-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabDetail;
