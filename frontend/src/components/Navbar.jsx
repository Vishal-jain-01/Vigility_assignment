import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">

        <div className="flex items-center gap-2.5">
          
          <span className="text-white font-bold text-lg tracking-tight">Vigility</span>
        </div>


        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-white text-sm font-medium leading-none">{user?.username}</span>
            <span className="text-gray-400 text-xs mt-0.5">
              {user?.gender} · {user?.age} yrs
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
