import React, { useState } from "react"
import { Power } from "lucide-react"
import Dashboard from "./Dashboard"
import Leads from "./Leads"
import Contacts from "./Contacts"

export default function CRMDashboard() {
  const [view, setView] = useState("dashboard")

  function logout() {
    localStorage.removeItem("token")
    window.location.href = "/"
  }

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
              <button
                onClick={() => setView("dashboard")}
                className={view === "dashboard" ? "bg-blue-600 px-3 py-1 rounded" : "bg-gray-700 px-3 py-1 rounded"}
              >
                Dashboard
              </button>

              <button
                onClick={() => setView("leads")}
                className={view === "leads" ? "bg-blue-600 px-3 py-1 rounded" : "bg-gray-700 px-3 py-1 rounded"}
              >
                Leads
              </button>
              <button
                onClick={() => setView("contacts")}
                className={view === "contacts" ? "bg-blue-600 px-3 py-1 rounded" : "bg-gray-700 px-3 py-1 rounded"}
              >
                Contacts
              </button>

              <button onClick={logout} className="bg-red-600 p-2 rounded-full">
                <Power size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {view === "dashboard" && <Dashboard />}
          {view === "leads" && <Leads />}
          {view === "contacts" && <Contacts />}
        </div>
      </div>
    </>
  )
}
