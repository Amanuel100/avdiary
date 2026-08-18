const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

export { API_BASE, BACKEND_URL };