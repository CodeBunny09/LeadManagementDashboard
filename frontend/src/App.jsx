import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import CRMDashboard from './pages/CRMDashboard'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  // Listen for storage changes (for logout)
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'))
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route
          path="/*"
          element={token ? <CRMDashboard /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App