import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    const storedToken = localStorage.getItem('fo_token');
    const storedInfo  = localStorage.getItem('fo_vendor');
    if (storedToken && storedInfo) {
      setToken(storedToken);
      setVendor(JSON.parse(storedInfo));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await axios.post(`${API_BASE}/vendor-portal/auth/login`, { email, password });
    setToken(data.token);
    setVendor(data.vendor);
    localStorage.setItem('fo_token', data.token);
    localStorage.setItem('fo_vendor', JSON.stringify(data.vendor));
  };

  const logout = () => {
    setToken(null);
    setVendor(null);
    localStorage.removeItem('fo_token');
    localStorage.removeItem('fo_vendor');
  };

  return (
    <AuthContext.Provider value={{ vendor, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
