import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useSocket } from '../SocketContext';
import SuperUserPanel from './SuperUserPanel';
import { cleanText } from '../utils/unicode';
import './AdminPanel.css';

// Función para decodificar caracteres Unicode
const decodeUnicode = (str: string): string => {
  if (!str) return '';
  try {
    return decodeURIComponent(JSON.parse('"' + str.replace(/\"/g, '\\"') + '"'));
  } catch {
    return str;
  }
};

interface Lab {
  id: number;
  name: string;
  location: string;
  capacity: number;
  description: string;
  opening_time: string;
  closing_time: string;
}

interface Computer {
  id: number;
  name: string;
  hostname: string;
  specs: string;
  status: string;
  laboratory_id: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Reservation {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  user_id: number;
  computer_id: number;
  user?: User;
  computer?: Computer;
  laboratory?: Lab;
  created_at: string;
  updated_at: string;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  
  // Verificar si el usuario está cargado
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando usuario...</p>
      </div>
    );
  }
  
  // Redirigir a superusuario si es necesario
  if (user.role === 'superuser') {
    return <SuperUserPanel />;
  }
  
  // Verificar que el usuario sea admin
  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Acceso denegado. Solo los administradores pueden acceder a este panel.</p>
      </div>
    );
  }
  
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [labs, setLabs] = useState<Lab[]>([]);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  // Estadísticas del sistema
  const [stats, setStats] = useState({
    totalLabs: 0,
    totalComputers: 0,
    availableComputers: 0,
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalAdmins: 0
  });

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

  const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(''); // Limpiar errores anteriores
        
        console.log('🔄 Cargando datos para la pestaña:', activeTab);
        
        if (activeTab === 'dashboard') {
          console.log('📊 Cargando dashboard y estadísticas...');
          
          // Cargar todos los datos para el dashboard
          const [labsResponse, computersResponse, reservationsResponse, usersResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/labs`),
            axios.get(`${API_BASE_URL}/computers`),
            axios.get(`${API_BASE_URL}/reservations/all`),
            axios.get(`${API_BASE_URL}/auth/users`)
          ]);
          
          const labs = labsResponse.data;
          const computers = computersResponse.data;
          const reservations = reservationsResponse.data;
          const users = usersResponse.data;
          
          // Calcular estadísticas
          const availableComputers = computers.filter((comp: Computer) => comp.status === 'available').length;
          const pendingReservations = reservations.filter((res: Reservation) => res.status === 'pending').length;
          const confirmedReservations = reservations.filter((res: Reservation) => res.status === 'confirmed').length;
          const totalStudents = users.filter((u: User) => u.role === 'student').length;
          const totalAdmins = users.filter((u: User) => u.role === 'admin').length;
          
          setStats({
            totalLabs: labs.length,
            totalComputers: computers.length,
            availableComputers,
            totalReservations: reservations.length,
            pendingReservations,
            confirmedReservations,
            totalUsers: users.length,
            totalStudents,
            totalAdmins
          });
          
          setLabs(labs);
          setComputers(computers);
          setReservations(reservations);
          setUsers(users);
          
          console.log('✅ Dashboard cargado con estadísticas');
          
        } else if (activeTab === 'labs') {
          console.log('📋 Cargando laboratorios...');
          const response = await axios.get(`${API_BASE_URL}/labs`);
          console.log('✅ Laboratorios cargados:', response.data.length);
          setLabs(response.data);
        } else if (activeTab === 'computers') {
          console.log('💻 Cargando computadoras...');
          const response = await axios.get(`${API_BASE_URL}/computers`);
          console.log('✅ Computadoras cargadas:', response.data.length);
          setComputers(response.data);
        } else if (activeTab === 'reservations') {
          console.log('📅 Cargando reservas...');
          const response = await axios.get(`${API_BASE_URL}/reservations/all`);
          console.log('✅ Reservas cargadas:', response.data.length);
          
          // Obtener detalles completos para cada reserva
          const reservationsWithDetails = await Promise.all(
            response.data.map(async (reservation: Reservation) => {
              try {
                // Obtener detalles del usuario
                const userResponse = await axios.get(`${API_BASE_URL}/auth/users/${reservation.user_id}`);
                
                // Obtener detalles de la computadora
                const computerResponse = await axios.get(`${API_BASE_URL}/computers/${reservation.computer_id}`);
                const computer = computerResponse.data;
                
                // Obtener detalles del laboratorio
                const labResponse = await axios.get(`${API_BASE_URL}/labs/${computer.laboratory_id}`);

                return {
                  ...reservation,
                  user: userResponse.data,
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
        } else if (activeTab === 'users') {
          console.log('👥 Cargando usuarios...');
          const response = await axios.get(`${API_BASE_URL}/auth/users`);
          console.log('✅ Usuarios cargados:', response.data.length);
          setUsers(response.data);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error(`❌ Error al cargar datos de ${activeTab}:`, err);
        const errorMessage = err.response?.data?.message || err.message || `Error al cargar los datos de ${activeTab}`;
        setError(`${errorMessage}. Por favor, intenta de nuevo más tarde.`);
        setLoading(false);
      }
    };

    fetchData();

    // Escuchar actualizaciones en tiempo real
    if (socket) {
      socket.on('lab_update', () => {
        if (activeTab === 'labs') fetchData();
      });
      socket.on('computer_status_updated', () => {
        if (activeTab === 'computers') fetchData();
      });
      socket.on('reservation_update', () => {
        if (activeTab === 'reservations') fetchData();
      });
      
      // Escuchar eliminación de laboratorios
      socket.on('lab_deleted', (data) => {
        console.log('Laboratorio eliminado en tiempo real:', data);
        if (activeTab === 'labs') {
          setLabs(prevLabs => prevLabs.filter(lab => lab.id !== data.lab_id));
        }
      });
      
      // Escuchar eliminación de computadoras
      socket.on('computer_deleted', (data) => {
        console.log('Computadora eliminada en tiempo real:', data);
        if (activeTab === 'computers') {
          setComputers(prevComputers => prevComputers.filter(computer => computer.id !== data.computer_id));
        }
      });
      
      // Escuchar actualizaciones de estado de computadoras
      socket.on('computer_status_updated', (data) => {
        console.log('Estado de computadora actualizado en tiempo real:', data);
        if (activeTab === 'computers') {
          setComputers(prevComputers => 
            prevComputers.map(computer => 
              computer.id === data.computer_id 
                ? { ...computer, status: data.new_status }
                : computer
            )
          );
        }
      });
      
      // Escuchar actualizaciones de estado de reservas
      socket.on('reservation_status_updated', (data) => {
        console.log('Estado de reserva actualizado en tiempo real:', data);
        if (activeTab === 'reservations') {
          setReservations(prevReservations => 
            prevReservations.map(reservation => 
              reservation.id === data.reservation_id 
                ? { ...reservation, status: data.new_status }
                : reservation
            )
          );
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('lab_update');
        socket.off('computer_status_update');
        socket.off('reservation_update');
        socket.off('lab_deleted');
        socket.off('computer_deleted');
        socket.off('computer_status_updated');
        socket.off('reservation_status_updated');
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
      await axios.post(`${API_BASE_URL}/labs`, labFormData);
      setShowLabForm(false);
      // Recargar laboratorios
      const response = await axios.get(`${API_BASE_URL}/labs`);
      setLabs(response.data);
    } catch (err) {
      console.error('Error al crear laboratorio:', err);
      setError('Error al crear el laboratorio. Por favor, verifica los datos e intenta de nuevo.');
    }
  };

  const handleComputerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/computers`, {
        ...computerFormData,
        specs: JSON.stringify({ description: computerFormData.specs }),
        status: 'available'
      });
      setShowComputerForm(false);
      // Recargar computadoras
      const response = await axios.get(`${API_BASE_URL}/computers`);
      setComputers(response.data);
    } catch (err) {
      console.error('Error al crear computadora:', err);
      setError('Error al crear la computadora. Por favor, verifica los datos e intenta de nuevo.');
    }
  };

  const handleDeleteLab = async (labId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este laboratorio? Esta acción también eliminará todas las computadoras asociadas.')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/labs/${labId}`);
      setLabs(prevLabs =>
        prevLabs.filter(lab => lab.id !== labId)
      );
      setMessage('Laboratorio eliminado exitosamente');
    } catch (err) {
      console.error('Error al eliminar laboratorio:', err);
      setError('Error al eliminar el laboratorio');
    }
  };

  const handleDeleteComputer = async (computerId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta computadora?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/computers/${computerId}`);
      setComputers(prevComputers =>
        prevComputers.filter(computer => computer.id !== computerId)
      );
      setMessage('Computadora eliminada exitosamente');
    } catch (err) {
      console.error('Error al eliminar computadora:', err);
      setError('Error al eliminar la computadora');
    }
  };

  const handleUpdateComputerStatus = async (computerId: number, newStatus: string) => {
    try {
      console.log('🔧 ADMIN: Cambiando estado de computadora');
      console.log('   - Computer ID:', computerId);
      console.log('   - Nuevo estado:', newStatus);
      console.log('   - URL de la petición:', `${API_BASE_URL}/computers/${computerId}/status`);
      
      const response = await axios.put(`${API_BASE_URL}/computers/${computerId}/status`, {
        status: newStatus
      });
      
      console.log('✅ ADMIN: Estado de computadora actualizado exitosamente');
      console.log('   - Respuesta del servidor:', response.data);
      
      setComputers(prevComputers =>
        prevComputers.map(computer =>
          computer.id === computerId
            ? { ...computer, status: newStatus }
            : computer
        )
      );
      setMessage(`Estado de computadora actualizado a ${newStatus}`);
    } catch (err: any) {
      console.error('❌ ADMIN: Error al actualizar estado de computadora:', err);
      console.error('   - Detalles del error:', err.response?.data || err.message);
      setError('Error al actualizar el estado de la computadora');
    }
  };

  // Nuevas funciones para manejar reservas
  const handleConfirmReservation = async (reservationId: number) => {
    try {
      await axios.put(`${API_BASE_URL}/reservations/${reservationId}/confirm`);
      setReservations(prevReservations =>
        prevReservations.map(reservation =>
          reservation.id === reservationId
            ? { ...reservation, status: 'confirmed' }
            : reservation
        )
      );
      setMessage('Reserva confirmada exitosamente');
    } catch (err) {
      console.error('Error al confirmar reserva:', err);
      setError('Error al confirmar la reserva');
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    try {
      await axios.put(`${API_BASE_URL}/reservations/${reservationId}/cancel`);
      setReservations(prevReservations =>
        prevReservations.map(reservation =>
          reservation.id === reservationId
            ? { ...reservation, status: 'cancelled' }
            : reservation
        )
      );
      setMessage('Reserva cancelada exitosamente');
    } catch (err) {
      console.error('Error al cancelar reserva:', err);
      setError('Error al cancelar la reserva');
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
    <div className="admin-panel">
      <h1>Panel de Administración</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      {message && (
        <div className="alert alert-success" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <div className="nav-tabs">
        <button
          className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-link ${activeTab === 'labs' ? 'active' : ''}`}
          onClick={() => setActiveTab('labs')}
        >
          🏢 Gestión de Laboratorios
        </button>
        <button
          className={`nav-link ${activeTab === 'computers' ? 'active' : ''}`}
          onClick={() => setActiveTab('computers')}
        >
          💻 Gestión de Computadoras
        </button>
        <button
          className={`nav-link ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          📅 Gestión de Reservas
        </button>
        <button
          className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Gestión de Usuarios
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="tab-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-section">
              <h2>📊 Dashboard del Sistema</h2>
              
              {/* Estadísticas principales */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🏢</div>
                  <div className="stat-content">
                    <h3>Laboratorios</h3>
                    <p className="stat-number">{stats.totalLabs}</p>
                    <p className="stat-label">Total en el sistema</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">💻</div>
                  <div className="stat-content">
                    <h3>Computadoras</h3>
                    <p className="stat-number">{stats.totalComputers}</p>
                    <p className="stat-label">Total: {stats.availableComputers} disponibles</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <h3>Reservas</h3>
                    <p className="stat-number">{stats.totalReservations}</p>
                    <p className="stat-label">{stats.pendingReservations} pendientes, {stats.confirmedReservations} confirmadas</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>Usuarios</h3>
                    <p className="stat-number">{stats.totalUsers}</p>
                    <p className="stat-label">{stats.totalStudents} estudiantes, {stats.totalAdmins} administradores</p>
                  </div>
                </div>
              </div>
              
              {/* Resumen rápido */}
              <div className="quick-summary">
                <h3>📋 Resumen Rápido</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Reservas Pendientes:</span>
                    <span className="summary-value pending">{stats.pendingReservations}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Computadoras en Mantenimiento:</span>
                    <span className="summary-value maintenance">
                      {computers.filter(comp => comp.status === 'maintenance').length}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Ocupación del Sistema:</span>
                    <span className="summary-value">
                      {stats.totalComputers > 0 ? Math.round(((stats.totalComputers - stats.availableComputers) / stats.totalComputers) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Acciones rápidas */}
              <div className="quick-actions">
                <h3>⚡ Acciones Rápidas</h3>
                <div className="actions-grid">
                  <button 
                    className="action-btn"
                    onClick={() => setActiveTab('reservations')}
                  >
                    📅 Ver Reservas Pendientes
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => setActiveTab('computers')}
                  >
                    🔧 Gestionar Computadoras
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => setActiveTab('labs')}
                  >
                    🏢 Gestionar Laboratorios
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => setActiveTab('users')}
                  >
                    👥 Ver Usuarios
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'labs' && (
            <div className="labs-section">
              <h2>Laboratorios</h2>
              <div className="labs-grid">
                {labs.map((lab) => (
                  <div key={lab.id} className="lab-card">
                    <h3>{decodeUnicode(lab.name)}</h3>
                    <p><strong>Ubicación:</strong> {decodeUnicode(lab.location)}</p>
                    <p><strong>Capacidad:</strong> {lab.capacity} computadoras</p>
                    <p><strong>Horario:</strong> {lab.opening_time} - {lab.closing_time}</p>
                    <p><strong>Descripción:</strong> {decodeUnicode(lab.description)}</p>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteLab(lab.id)}
                    >
                      Eliminar Laboratorio
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'computers' && (
            <div className="computers-section">
              <h2>Computadoras</h2>
              <div className="computers-grid">
                {computers.map((computer) => (
                  <div key={computer.id} className="computer-card">
                    <h3>{decodeUnicode(computer.name)}</h3>
                    <p><strong>Estado:</strong> 
                      <span className={`status-badge status-${computer.status}`}>
                        {computer.status === 'available' ? 'Disponible' :
                         computer.status === 'maintenance' ? 'Mantenimiento' :
                         computer.status === 'reserved' ? 'Reservada' : computer.status}
                      </span>
                    </p>
                    <p><strong>Laboratorio:</strong> {labs.find(lab => lab.id === computer.laboratory_id)?.name || `ID: ${computer.laboratory_id}`}</p>
                    <p><strong>Especificaciones:</strong> {decodeUnicode(computer.specs)}</p>
                    
                    <div className="computer-actions">
                      <select
                        value={computer.status}
                        onChange={(e) => handleUpdateComputerStatus(computer.id, e.target.value)}
                        className="form-select"
                      >
                        <option value="available">Disponible</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="reserved">Reservada</option>
                      </select>
                      
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteComputer(computer.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="reservations-section">
              <h2>Reservas de Estudiantes</h2>
              <div className="reservations-list">
                {reservations.map((reservation) => (
                  <div key={reservation.id} className="reservation-card">
                    <div className="reservation-header">
                      <h3>Reserva #{reservation.id}</h3>
                      <span className={`status-badge status-${reservation.status}`}>
                        {reservation.status === 'pending' ? 'Pendiente' :
                         reservation.status === 'confirmed' ? 'Confirmada' :
                         reservation.status === 'cancelled' ? 'Cancelada' : reservation.status}
                      </span>
                    </div>
                    
                    <div className="reservation-details">
                      <p><strong>Estudiante ID:</strong> {reservation.user_id}</p>
                      <p><strong>Computadora ID:</strong> {reservation.computer_id}</p>
                      <p><strong>Fecha de inicio:</strong> {formatDateTime(reservation.start_time)}</p>
                      <p><strong>Fecha de fin:</strong> {formatDateTime(reservation.end_time)}</p>
                      <p><strong>Creada:</strong> {formatDateTime(reservation.created_at)}</p>
                    </div>
                    
                    {reservation.status === 'pending' && (
                      <div className="reservation-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => handleConfirmReservation(reservation.id)}
                        >
                          Confirmar Reserva
                        </button>
                        <button
                          className="btn btn-warning"
                          onClick={() => handleCancelReservation(reservation.id)}
                        >
                          Cancelar Reserva
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-section">
              <h2>👥 Gestión de Usuarios</h2>
              <div className="users-list">
                {users.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-header">
                      <h3>{decodeUnicode(user.name)}</h3>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'student' ? '👨‍🎓 Estudiante' :
                         user.role === 'admin' ? '👨‍💼 Administrador' :
                         user.role === 'superuser' ? '👑 Superusuario' : user.role}
                      </span>
                    </div>
                    
                    <div className="user-details">
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>ID:</strong> {user.id}</p>
                      <p><strong>Rol:</strong> {user.role}</p>
                      <p><strong>Creado:</strong> {formatDateTime(user.created_at || new Date().toISOString())}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
