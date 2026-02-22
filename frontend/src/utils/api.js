import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8002',
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token')
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
