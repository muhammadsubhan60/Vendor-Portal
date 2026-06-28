import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../api';
import { useAuth } from './AuthContext';

interface SocketCtx {
  socket: Socket | null;
  newJobCount: number;
  clearNewJobCount: () => void;
}

const SocketContext = createContext<SocketCtx>({
  socket: null,
  newJobCount: 0,
  clearNewJobCount: () => {},
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const socketRef  = useRef<Socket | null>(null);
  const [newJobCount, setNewJobCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    const socket = io(`${SOCKET_URL}/vendor`, {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('new-job', () => setNewJobCount(n => n + 1));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      newJobCount,
      clearNewJobCount: () => setNewJobCount(0),
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
