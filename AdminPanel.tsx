import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

interface Lab {
  id: number;
  name: string;
  location: string;
  capacity: number;
  description: string;
}

interface Computer {
  id: number;
  name: string;
  hostname: string;
  specs: string;
  status: string;
  laboratory_id: number;
}

interface Reservation {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  user_id: number;
  computer_id: number;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<string>('labs');
  const [labs, setLabs] = useState<Lab[]>([]);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Estados para formularios
  const [showLabForm, setShowLabForm] = useState<boolean>(false);
  const [showComputerForm, setShowComputerForm] = useState<boolean>(false);
  const [labFormData, setLabFormData] = useState({
    name: '',
    location: '',
    capacity: 0,
    opening_time: '',
    closing_time: '',
    description: ''
  });
  const [computerFormData, setComputerFormData] = useState({
    name: '',
    hostname: '',
    specs: '',
    laboratory_id: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === 'labs') {
          const response = await axios.get('http://localhost:5000/api/labs');
          setLabs(response.data);
        } else if (activeTab === 'computers') {
          const response = await axios.get('http://localhost:5000/api/computers');
          setComputers(response.data);
        } else if (activeTab === 'reservations') {
          const response = await axios.get('http://localhost:5000/api/reservations/all');
          setReservations(response.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error(`Error al cargar datos de ${activeTab}:`, err);
        setError(`Error al cargar los datos de ${activeTab}. Por favor, intenta de nuevo más tarde.`);
        setLoading(false);
      }
    };

    fetchData();

    // Escuchar actualizaciones en tiempo real
    if (socket) {
      socket.on('lab_update', () => {
        if (activeTab === 'labs') fetchData();
      });
      socket.on('computer_status_update', () => {
        if (activeTab === 'computers') fetchData();
      });
      socket.on('reservation_update', () => {
        if (activeTab === 'reservations') fetchData();
      });
    }

    return () => {
      if (socket) {
        socket.off('lab_update');
        socket.off('computer_status_update');
        socket.off('reservation_update');
      }
    };
  }, [activeTab, socket]);

  const handleLabFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLabFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleComputerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setComputerFormData(prev => ({
      ...prev,
      [name]: name === 'laboratory_id' ? parseInt(value) : value
    }));
  };

  const handleLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/labs', labFormData);
      setShowLabForm(false);
      // Recargar laboratorios
      const response = await axios.get('http://localhost:5000/api/labs');
      setLabs(response.data);
    } catch (err) {
      console.error('Error al crear laboratorio:', err);
      setError('Error al crear el laboratorio. Por favor, verifica los datos e intenta de nuevo.');
    }
  };

  const handleComputerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/computers', {
        ...computerFormData,
        specs: JSON.stringify({ description: computerFormData.specs }),
        status: 'available'
      });
      setShowComputerForm(false);
      // Recargar computadoras
      const response = await axios.get('http://localhost:5000/api/computers');
      setComputers(response.data);
    } catch (err) {
      console.error('Error al crear computadora:', err);
      setError('Error al crear la computadora. Por favor, verifica los datos e intenta de nuevo.');
    }
  };

  const handleDeleteLab = async (labId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este laboratorio? Esta acción no se puede deshacer.')) {
      try {
        await axios.delete(`http://localhost:5000/api/labs/${labId}`);
        setLabs(labs.filter(lab => lab.id !== labId));
      } catch (err) {
        console.error('Error al eliminar laboratorio:', err);
        setError('Error al eliminar el laboratorio. Puede que tenga computadoras asociadas.');
      }
    }
  };

  const handleDeleteComputer = async (computerId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta computadora? Esta acción no se puede deshacer.')) {
      try {
        await axios.delete(`http://localhost:5000/api/computers/${computerId}`);
        setComputers(computers.filter(computer => computer.id !== computerId));
      } catch (err) {
        console.error('Error al eliminar computadora:', err);
        setError('Error al eliminar la computadora. Puede que tenga reservas asociadas.');
      }
    }
  };

  const handleUpdateComputerStatus = async (computerId: number, status: string) => {
    try {
      await axios.put(`http://localhost:5000/api/computers/${computerId}/status`, { status });
      // Actualizar el estado en la lista local
      setComputers(computers.map(computer => 
        computer.id === computerId ? { ...computer, status } : computer
      ));
    } catch (err) {
      console.error('Error al actualizar estado de la computadora:', err);
      setError('Error al actualizar el estado de la computadora.');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Acceso denegado:</strong>
          <span className="block sm:inline"> No tienes permisos para acceder al panel de administración.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError('')}
          >
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('labs')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'labs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Laboratorios
            </button>
            <button
              onClick={() => setActiveTab('computers')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'computers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Computadoras
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'reservations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reservas
            </button>
          </nav>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Cargando...</span>
            </div>
            <p className="mt-2">Cargando datos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Gestión de Laboratorios */}
          {activeTab === 'labs' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gestión de Laboratorios</h2>
                <button
                  onClick={() => setShowLabForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                >
                  Nuevo Laboratorio
                </button>
              </div>
              
              {labs.length === 0 ? (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">No hay laboratorios registrados.</span>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {labs.map((lab) => (
                      <li key={lab.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600 truncate">
                              {lab.name}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <button
                                onClick={() => handleDeleteLab(lab.id)}
                                className="ml-2 px-3 py-1 border border-red-300 text-red-700 text-sm rounded-md hover:bg-red-50"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                {lab.location}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                Capacidad: {lab.capacity} computadoras
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Modal de Nuevo Laboratorio */}
              {showLabForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4">Nuevo Laboratorio</h2>
                    
                    <form onSubmit={handleLabSubmit}>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                          Nombre
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          value={labFormData.name}
                          onChange={handleLabFormChange}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          value={labFormData.location}
                          onChange={handleLabFormChange}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="capacity">
                          Capacidad
                        </label>
                        <input
                          type="number"
                          id="capacity"
                          name="capacity"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          value={labFormData.capacity}
                          onChange={handleLabFormChange}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="opening_time">
                          Hora de apertura
                        </label>
                        <input
                          type="time"
                          id="opening_time"
                          name="opening_time"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          value={labFormData.opening_time}
                          onChange={handleLabFormChange}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="closing_time">
                          Hora de cierre
                        </label>
                        <input
                          type="time"
                          id="closing_time"
                          name="closing_time"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          value={labFormData.closing_time}
                          onChange={handleLabFormChange}
                          required
                        />
                      </div>
                      <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                          Descripción
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          value={labFormData.description}
                          onChange={handleLabFormChange}
                          rows={3}
                        ></textarea>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowLabForm(false)}
                          className="mr-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Guardar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Gestión de Computadoras */}
          {activeTab === 'computers' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gestión de Computadoras</h2>
                <button
                  onClick={() => setShowComputerForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                >
                  Nueva Computadora
                </button>
              </div>
              
              {computers.length === 0 ? (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">No hay computadoras registradas.</span>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {computers.map((computer) => (
                      <li key={computer.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-600 truncate">
                                {computer.name}
                              </p>
                              <span 
                                className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
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
                            <div className="ml-2 flex-shrink-0 flex">
                              <div className="relative inline-block text-left">
                                <select
                                  onChange={(e) => handleUpdateComputerStatus(computer.id, e.target.value)}
                                  value={computer.status}
                                  className="block w-full px-3 py-1.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                  <option value="available">Disponible</option>
                                  <option value="maintenance">Mantenimiento</option>
                                  <option value="reserved">Reservada</option>
                                </select>
                              </div>
                              <button
                                onClick={() => handleDeleteComputer(computer.id)}
                                className="ml-2 px-3 py-1 border border-red-300 text-red-700 text-sm rounded-md hover:bg-red-50"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                Hostname: {computer.hostname}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                Laboratorio ID: {computer.laboratory_id}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Modal de Nueva Computadora */}
              {showComputerForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4">Nueva Computadora</h2>
                    
                    <form onSubmit={handleComputerSubmit}>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                          Nombre
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          value={computerFormData.name}
                          onChange={handleComputerFormChange}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hostname">
                          Hostname
                        </label>
                        <input
                          type="text"
                          id="hostname"
                          name="hostname"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          value={computerFormData.hostname}
                          onChange={handleComputerFormChange}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="specs">
                          Especificaciones
                        </label>
                        <textarea
                          id="specs"
                          name="specs"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          value={computerFormData.specs}
                          onChange={handleComputerFormChange}
                          rows={3}
                        ></textarea>
                      </div>
                      <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="laboratory_id">
                          Laboratorio
                        </label>
                        <select
                          id="laboratory_id"
                          name="laboratory_id"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          value={computerFormData.laboratory_id}
                          onChange={handleComputerFormChange}
                          required
                        >
                          <option value="">Selecciona un laboratorio</option>
                          {labs.map(lab => (
                            <option key={lab.id} value={lab.id}>{lab.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowComputerForm(false)}
                          className="mr-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Guardar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Gestión de Reservas */}
          {activeTab === 'reservations' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Gestión de Reservas</h2>
              
              {reservations.length === 0 ? (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">No hay reservas registradas.</span>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {reservations.map((reservation) => (
                      <li key={reservation.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600 truncate">
                              Reserva #{reservation.id}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span 
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                  reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {reservation.status === 'confirmed' ? 'Confirmada' : 
                                 reservation.status === 'pending' ? 'Pendiente' : 
                                 reservation.status === 'cancelled' ? 'Cancelada' : 
                                 reservation.status === 'completed' ? 'Completada' : reservation.status}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                Usuario ID: {reservation.user_id}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                Computadora ID: {reservation.computer_id}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <p>
                                {new Date(reservation.start_time).toLocaleString()} - {new Date(reservation.end_time).toLocaleString()}
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
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;
