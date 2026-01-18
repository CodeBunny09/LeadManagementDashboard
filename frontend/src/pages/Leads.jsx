import React, { useEffect, useState } from "react"
import { 
  Trash2, Download, Edit2, Eye, 
  ChevronLeft, ChevronRight, Users, Mail, Building, 
  Phone, Calendar, RefreshCw, List, Grid,
  ArrowUpDown
} from "lucide-react"
import API from "../services/api"
import LeadFormModal from "../components/LeadFormModal"
import LeadFilter from "./components/LeadFilter"

const stageColors = {
  new: "#3b82f6",
  contacted: "#f59e0b",
  qualified: "#8b5cf6",
  converted: "#10b981"
}

const stageLabels = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted"
}

const PAGE_SIZE = 15

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [companyFilter, setCompanyFilter] = useState("")
  
  const [viewAll, setViewAll] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [selected, setSelected] = useState(new Set())
  const [expandedLead, setExpandedLead] = useState(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [inlineEditStage, setInlineEditStage] = useState(null)
  
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [loading, setLoading] = useState(false)
  
  const [companies, setCompanies] = useState([])

  /* ===================== DATA LOADING ===================== */
  useEffect(() => {
    loadLeads()
  }, [search, stageFilter, dateFilter, companyFilter, page, sortBy, sortOrder, viewAll])

  async function loadLeads() {
    setLoading(true)
    try {
      const params = viewAll 
        ? { search, stage: stageFilter, sort: sortOrder }
        : { search, stage: stageFilter, page, limit: PAGE_SIZE, sort: sortOrder }

      const res = await API.get("/api/leads", { params })
      let filteredLeads = res.data.leads

      // Client-side date filtering
      if (dateFilter !== "all") {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        filteredLeads = filteredLeads.filter(lead => {
          const leadDate = new Date(lead.createdAt)
          
          if (dateFilter === "today") {
            return leadDate >= today
          } else if (dateFilter === "week") {
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)
            return leadDate >= weekAgo
          } else if (dateFilter === "month") {
            const monthAgo = new Date(today)
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return leadDate >= monthAgo
          }
          return true
        })
      }

      // Client-side company filtering
      if (companyFilter) {
        filteredLeads = filteredLeads.filter(lead => 
          lead.company?.toLowerCase().includes(companyFilter.toLowerCase())
        )
      }

      setLeads(filteredLeads)
      setTotal(viewAll ? filteredLeads.length : (res.data.total || filteredLeads.length))
      setSelected(new Set())
      
      // Extract unique companies
      const uniqueCompanies = [...new Set(res.data.leads.map(l => l.company).filter(Boolean))]
      setCompanies(uniqueCompanies.sort())
    } catch (error) {
      console.error("Failed to load leads:", error)
    } finally {
      setLoading(false)
    }
  }

  /* ===================== CRUD OPERATIONS ===================== */
  async function handleSave(formData) {
    try {
      if (editingLead) {
        await API.put(`/api/leads/${editingLead._id}`, formData)
      } else {
        await API.post("/api/leads", formData)
      }
      setIsModalOpen(false)
      setEditingLead(null)
      loadLeads()
    } catch (error) {
      console.error("Failed to save lead:", error)
      alert("Failed to save lead")
    }
  }

  async function deleteLead(id) {
    if (!confirm("Delete this lead?")) return
    try {
      await API.delete(`/api/leads/${id}`)
      loadLeads()
    } catch (error) {
      console.error("Failed to delete lead:", error)
      alert("Failed to delete lead")
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} leads?`)) return

    try {
      await Promise.all([...selected].map(id => API.delete(`/api/leads/${id}`)))
      loadLeads()
    } catch (error) {
      console.error("Failed to delete leads:", error)
      alert("Failed to delete leads")
    }
  }

  /* ===================== INLINE STAGE EDIT ===================== */
  async function updateStage(leadId, newStage) {
    try {
      const lead = leads.find(l => l._id === leadId)
      await API.put(`/api/leads/${leadId}`, { ...lead, stage: newStage })
      setInlineEditStage(null)
      loadLeads()
    } catch (error) {
      console.error("Failed to update stage:", error)
      alert("Failed to update stage")
    }
  }

  /* ===================== SELECTION ===================== */
  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    const allIds = leads.map(l => l._id)
    const allSelected = allIds.every(id => selected.has(id))
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  /* ===================== BULK ACTIONS ===================== */
  async function bulkUpdateStage(newStage) {
    if (selected.size === 0) return
    if (!confirm(`Update ${selected.size} leads to ${newStage}?`)) return

    try {
      const updates = [...selected].map(id => {
        const lead = leads.find(l => l._id === id)
        return API.put(`/api/leads/${id}`, { ...lead, stage: newStage })
      })
      await Promise.all(updates)
      loadLeads()
    } catch (error) {
      console.error("Failed to update leads:", error)
      alert("Failed to update leads")
    }
  }

  /* ===================== EXPORT ===================== */
  function exportCSV() {
    const exportLeads = selected.size > 0 
      ? leads.filter(l => selected.has(l._id))
      : leads

    const headers = ["Name", "Email", "Phone", "Company", "Stage", "Created"]
    const rows = exportLeads.map(l => [
      l.name,
      l.email,
      l.phone || "",
      l.company || "",
      l.stage,
      new Date(l.createdAt).toLocaleDateString()
    ])
    
    let csv = headers.join(",") + "\n"
    rows.forEach(r => {
      csv += r.map(cell => `"${cell}"`).join(",") + "\n"
    })
    
    const blob = new Blob([csv], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  /* ===================== SORT ===================== */
  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  /* ===================== CLEAR FILTERS ===================== */
  function clearFilters() {
    setSearch("")
    setStageFilter("")
    setDateFilter("all")
    setCompanyFilter("")
    setPage(1)
  }

  /* ===================== STATS ===================== */
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.stage === "new").length,
    contacted: leads.filter(l => l.stage === "contacted").length,
    qualified: leads.filter(l => l.stage === "qualified").length,
    converted: leads.filter(l => l.stage === "converted").length
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className="glass p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="text-blue-400" size={28} />
              Lead Management
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {viewAll ? `Showing all ${total} leads` : `${total} total leads`} • {selected.size} selected
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => { setViewAll(false); setPage(1) }}
                className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-all ${
                  !viewAll 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List size={14} />
                Paginated
              </button>
              <button
                onClick={() => setViewAll(true)}
                className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-all ${
                  viewAll 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid size={14} />
                View All
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <Users size={16} />
              Add Lead
            </button>
            
            <button
              onClick={loadLeads}
              className="glass p-2 rounded-lg hover:bg-white/10 transition-all"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ===================== QUICK STATS ===================== */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} color="blue" />
        <StatCard label="New" value={stats.new} color="blue" />
        <StatCard label="Contacted" value={stats.contacted} color="orange" />
        <StatCard label="Qualified" value={stats.qualified} color="purple" />
        <StatCard label="Converted" value={stats.converted} color="green" />
      </div>

      {/* ===================== FILTERS ===================== */}
      <LeadFilter
        search={search}
        stage={stageFilter}
        dateFilter={dateFilter}
        companyFilter={companyFilter}
        companies={companies}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onStageChange={(v) => { setStageFilter(v); setPage(1) }}
        onDateChange={(v) => { setDateFilter(v); setPage(1) }}
        onCompanyChange={(v) => { setCompanyFilter(v); setPage(1) }}
        onClearAll={clearFilters}
      />

      {/* ===================== BULK ACTIONS BAR ===================== */}
      {selected.size > 0 && (
        <div className="glass p-4 bg-blue-600/10 border-blue-500/30 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-white font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">
                {selected.size}
              </div>
              leads selected
            </span>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 mr-1">Move to:</span>
              
              {["new", "contacted", "qualified", "converted"].map(stage => (
                <button
                  key={stage}
                  onClick={() => bulkUpdateStage(stage)}
                  className="px-3 py-1.5 rounded-lg text-xs hover:opacity-80 transition-all font-medium shadow-lg"
                  style={{ 
                    backgroundColor: stageColors[stage],
                    boxShadow: `0 4px 12px ${stageColors[stage]}40`
                  }}
                >
                  {stageLabels[stage]}
                </button>
              ))}
              
              <div className="w-px h-6 bg-white/20 mx-1"></div>
              
              <button
                onClick={exportCSV}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 flex items-center gap-1.5 font-medium shadow-lg shadow-green-500/30"
              >
                <Download size={12} />
                Export
              </button>
              
              <button
                onClick={bulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 font-medium shadow-lg shadow-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TABLE ===================== */}
      <div className="glass overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="animate-spin mx-auto text-blue-400 mb-2" size={32} />
            <p className="text-gray-400">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto text-gray-600 mb-2" size={48} />
            <p className="text-gray-400 mb-2">No leads found</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={leads.length > 0 && leads.every(l => selected.has(l._id))}
                      onChange={toggleAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      Name
                      {sortBy === "name" && <ArrowUpDown size={14} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Company</th>
                  <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">Stage</th>
                  <th className="px-4 py-3 text-left text-gray-300 text-sm font-semibold">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      Created
                      {sortBy === "createdAt" && <ArrowUpDown size={14} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-gray-300 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <React.Fragment key={lead._id}>
                    <tr 
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        selected.has(lead._id) ? 'bg-blue-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(lead._id)}
                          onChange={() => toggleOne(lead._id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{lead.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Mail size={14} />
                          <span className="text-sm">{lead.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Building size={14} />
                          <span className="text-sm">{lead.company || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {inlineEditStage === lead._id ? (
                          <select
                            autoFocus
                            value={lead.stage}
                            onChange={e => updateStage(lead._id, e.target.value)}
                            onBlur={() => setInlineEditStage(null)}
                            className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/20 text-white cursor-pointer"
                          >
                            {Object.keys(stageColors).map(stage => (
                              <option key={stage} value={stage} className="bg-gray-800">
                                {stageLabels[stage]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setInlineEditStage(lead._id)}
                            className="px-3 py-1 rounded-full text-xs transition-all hover:opacity-80 font-medium shadow-lg"
                            style={{ 
                              backgroundColor: stageColors[lead.stage],
                              boxShadow: `0 2px 8px ${stageColors[lead.stage]}40`
                            }}
                            title="Click to edit stage"
                          >
                            {stageLabels[lead.stage]}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar size={14} />
                          <span className="text-sm">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setExpandedLead(expandedLead === lead._id ? null : lead._id)}
                            className="p-1 hover:bg-white/10 rounded transition-all"
                            title="View details"
                          >
                            <Eye size={16} className="text-gray-400" />
                          </button>
                          <button
                            onClick={() => setEditingLead(lead)}
                            className="p-1 hover:bg-white/10 rounded transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} className="text-blue-400" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead._id)}
                            className="p-1 hover:bg-white/10 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {expandedLead === lead._id && (
                      <tr className="bg-white/5 border-b border-white/5 animate-in slide-in-from-top-1">
                        <td colSpan="7" className="px-4 py-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <DetailItem icon={<Mail />} label="Email" value={lead.email} />
                            <DetailItem icon={<Phone />} label="Phone" value={lead.phone || 'Not provided'} />
                            <DetailItem icon={<Building />} label="Company" value={lead.company || 'Not provided'} />
                            <DetailItem icon={<Calendar />} label="Created" value={new Date(lead.createdAt).toLocaleString()} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== PAGINATION ===================== */}
      {!viewAll && totalPages > 1 && (
        <div className="glass p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} leads
            </div>
            
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 glass rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        page === pageNum
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'glass hover:bg-white/10 text-gray-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 glass rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {viewAll && (
        <div className="glass p-4 text-center">
          <p className="text-gray-400">
            Viewing all {total} leads • Scroll to see more
          </p>
        </div>
      )}

      {/* ===================== MODAL ===================== */}
      <LeadFormModal
        isOpen={isModalOpen || !!editingLead}
        initialData={editingLead}
        onClose={() => { setIsModalOpen(false); setEditingLead(null) }}
        onSubmit={handleSave}
      />
    </div>
  )
}

/* ===================== COMPONENTS ===================== */

function StatCard({ label, value, color }) {
  const colors = {
    blue: "from-blue-600/20 to-blue-600/5 border-blue-500/30",
    orange: "from-orange-600/20 to-orange-600/5 border-orange-500/30",
    purple: "from-purple-600/20 to-purple-600/5 border-purple-500/30",
    green: "from-green-600/20 to-green-600/5 border-green-500/30"
  }

  return (
    <div className={`glass p-4 bg-gradient-to-br ${colors[color]}`}>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">{label}</div>
    </div>
  )
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-400">{icon}</div>
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
        <div className="text-sm text-white font-medium">{value}</div>
      </div>
    </div>
  )
}