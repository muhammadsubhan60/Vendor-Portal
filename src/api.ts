export const API_BASE   = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api').replace(/\/$/, '');
export const SOCKET_URL = API_BASE.replace(/\/api$/, '');
