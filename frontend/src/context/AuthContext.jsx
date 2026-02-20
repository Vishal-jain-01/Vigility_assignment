import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  useEffect(() => {
    localStorage.clear()
  }, [])


  const [user, setUser] = useState(() => {
    try {
      const cookieVal = Cookies.get('user_data')
      return cookieVal ? JSON.parse(cookieVal) : null
    } catch {
      return null
    }
  })

  const login = (userData) => {
    setUser(userData)
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch {

    }

    const userId = user?.id
    setUser(null)
    Cookies.remove('auth_token')
    Cookies.remove('user_data')
    if (userId) Cookies.remove(`vigility_filters_${userId}`)
    localStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
