import React from "react"
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom"
import { Power } from "lucide-react"
import Dashboard from "./Dashboard"
import Leads from "./Leads"
import Contacts from "./Contacts"

export default function CRMDashboard() {
  const navigate = useNavigate()
  const location = useLocation()

  function logout() {
    localStorage.removeItem("token")
    navigate("/login")
    // Force reload to clear state
    window.location.reload()
  }

  // Determine active view from current path
  const currentPath = location.pathname

  return (
    <>
      <style>{`
        body { background:#0a0e27; color:white; }
        .glass {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
      `}</style>

      <div className="min-h-screen">
        {/* HEADER */}
        <div className="glass sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="font-bold text-lg">⚡ Lead Management CRM</h1>

            <div className="flex gap-3 items-center">
              <Link
                to="/"
                className={`px-3 py-1 rounded transition-colors ${
                  currentPath === "/" || currentPath === "/dashboard"
                    ? "bg-blue-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Dashboard
              </Link>

              <Link
                to="/leads"
                className={`px-3 py-1 rounded transition-colors ${
                  currentPath === "/leads"
                    ? "bg-blue-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Leads
              </Link>

              <Link
                to="/contacts"
                className={`px-3 py-1 rounded transition-colors ${
                  currentPath === "/contacts"
                    ? "bg-blue-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Contacts
              </Link>

              <button onClick={logout} className="bg-red-600 p-2 rounded-full hover:bg-red-700 transition-colors">
                <Power size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/contacts" element={<Contacts />} />
          </Routes>
        </div>
      </div>
    </>
  )
}