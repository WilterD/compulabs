import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Admin = {
  id: number;
  name: string;
  email: string;
};

const SuperUserPanel = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<Admin[]>('/api/users?role=admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Error al obtener administradores:', error);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/users/admin', newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(response.data.message);
      setNewAdmin({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (error) {
      console.error('Error al crear admin:', error);
      setMessage('Ocurrió un error al crear el administrador');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Panel del Superusuario</h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Crear nuevo administrador</h3>
        <form onSubmit={handleCreateAdmin} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre"
            value={newAdmin.name}
            onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
            className="border rounded px-3 py-2 w-full"
            required
          />
          <input
            type="email"
            placeholder="Correo"
            value={newAdmin.email}
            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            className="border rounded px-3 py-2 w-full"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={newAdmin.password}
            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
            className="border rounded px-3 py-2 w-full"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Administrador'}
          </button>
        </form>
        {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
      </div>

      <h3 className="text-lg font-medium mb-2">Lista de administradores</h3>
      <ul className="space-y-2">
        {admins.map((admin) => (
          <li key={admin.id} className="border px-4 py-2 rounded">
            <p className="text-gray-800 font-medium">{admin.name}</p>
            <p className="text-gray-600 text-sm">{admin.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SuperUserPanel;
