import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';

interface VendorInfo {
  _id: string;
  name: string;
  carriers: string[];
}

interface AuthCtx {
  vendor: VendorInfo | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [vendor,  setVendor]  = useState<VendorInfo | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const interceptorId = useRef<number | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('fo_token');
    const storedInfo  = localStorage.getItem('fo_vendor');
    if (storedToken && storedInfo) {
      setToken(storedToken);
      setVendor(JSON.parse(storedInfo));
    }
    setLoading(false);
  }, []);

  // 401 interceptor — clears session and redirects to login on any expired token
  useEffect(() => {
    if (!token) return;
    interceptorId.current = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
          doLogout();
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    );
    return () => {
      if (interceptorId.current !== null) {
        axios.interceptors.response.eject(interceptorId.current);
      }
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const doLogout = () => {
    setToken(null);
    setVendor(null);
    localStorage.removeItem('fo_token');
    localStorage.removeItem('fo_vendor');
  };

  const login = async (email: string, password: string) => {
    const { data } = await axios.post(`${API_BASE}/vendor-portal/auth/login`, { email, password });
    setToken(data.token);
    setVendor(data.vendor);
    localStorage.setItem('fo_token', data.token);
    localStorage.setItem('fo_vendor', JSON.stringify(data.vendor));
  };

  return (
    <AuthContext.Provider value={{ vendor, token, loading, login, logout: doLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
