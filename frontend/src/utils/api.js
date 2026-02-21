import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8002',
  withCredentials: true 
})

// Attach Bearer token on every request (fallback when cross-origin cookies are blocked)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const register = (data) => api.post('/register', data)
export const login = (data) => api.post('/login', data)
export const track = (featureName) => api.post('/track', { feature_name: featureName })
export const getAnalytics = (params) => api.get('/analytics', { params })

export default api
