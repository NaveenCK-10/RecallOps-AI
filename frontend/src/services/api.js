import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || '';
const baseURL = rawUrl ? (rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`) : '/api';

const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

export const analyzeIncident = (log) => api.post('/analyze', { log });
export const searchMemory = (q, limit = 5) => api.get('/memory/search', { params: { q, limit } });
export const saveMemory = (data) => api.post('/memory/save', data);
export const getMemories = (params) => api.get('/memory', { params });
export const getMemoryStats = () => api.get('/memory/stats');
export const getIncidents = (params) => api.get('/incidents', { params });
export const getIncident = (id) => api.get(`/incidents/${id}`);
export const getAnalytics = () => api.get('/analytics');
export const getRuntime = (params) => api.get('/runtime', { params });

export default api;
