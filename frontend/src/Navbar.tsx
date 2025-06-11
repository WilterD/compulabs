import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed left-0 right-0 top-0 z-50">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <Link to="/dashboard" className="flex items-center">
            <span className="self-center text-xl font-semibold whitespace-nowrap">Sistema de Reservas</span>
          </Link>
        </div>
        <div className="flex items-center">
          <div className="flex items-center ml-3">
            <div>
              <button
                type="button"
                className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300"
                id="user-menu-button"
                aria-expanded="false"
              >
                <span className="sr-only">Abrir menú de usuario</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white">
                  {user?.name?.charAt(0)}
                </div>
              </button>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">{user?.name} </div>
              <div className="text-sm text-gray-500">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-5 text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
