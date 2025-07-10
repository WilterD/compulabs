import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  
  const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');


  useEffect(() => {
    // Inicializar la conexión de Socket.io
    console.log('🔌 SOCKET: Iniciando conexión WebSocket');
    console.log('   - URL del servidor:', API_BASE_URL);
    
    const socketInstance = io(API_BASE_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true
    });

    socketInstance.on('connect', () => {
      console.log('🔌 SOCKET: Conectado al servidor de WebSocket');
      console.log('   - Socket ID:', socketInstance.id);
      console.log('   - URL del servidor:', API_BASE_URL);
      setConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 SOCKET: Desconectado del servidor de WebSocket');
      console.log('   - Razón:', reason);
      setConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('❌ SOCKET: Error de conexión WebSocket:', error);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ SOCKET: Error de conexión:', error);
      setConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔌 SOCKET: Reconectado después de', attemptNumber, 'intentos');
      setConnected(true);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('❌ SOCKET: Error de reconexión:', error);
    });

    setSocket(socketInstance);

    // Limpiar al desmontar
    return () => {
      console.log('🔌 SOCKET: Desconectando WebSocket');
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket debe ser usado dentro de un SocketProvider');
  }
  return context;
};
