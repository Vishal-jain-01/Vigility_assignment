import React, { createContext, useContext, useState } from 'react'
import Cookies from 'js-cookie'
import api from '../utils/api'

const AuthContext = createContext(null)

// Store token in a cookie accessible to JS (for cross-origin Bearer auth)
const TOKEN_COOKIE = 'auth_token'
const COOKIE_OPTS = { expires: 1, sameSite: 'None', secure: true }

export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {
    try {
      const cookieVal = Cookies.get('user_data')
      return cookieVal ? JSON.parse(cookieVal) : null
    } catch {
      return null
    }
  })

  const login = (userData, token) => {
    setUser(userData)
    if (token) {
      Cookies.set(TOKEN_COOKIE, token, COOKIE_OPTS)
    }
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch {

    }

    const userId = user?.id
    setUser(null)
    Cookies.remove(TOKEN_COOKIE)
    Cookies.remove('user_data')
    if (userId) Cookies.remove(`vigility_filters_${userId}`)
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
