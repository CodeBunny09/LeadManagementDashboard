import React, { useState } from "react"
import { Search, Filter, X, Calendar, Building, Mail, ChevronDown } from "lucide-react"

const stages = ["", "new", "contacted", "qualified", "converted"]

export default function LeadFilter({ 
  search, 
  stage, 
  dateFilter,
  companyFilter,
  companies,
  onSearchChange, 
  onStageChange,
  onDateChange,
  onCompanyChange,
  onClearAll
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const hasActiveFilters = search || stage || dateFilter !== "all" || companyFilter
  
  return (
    <div className="glass p-4 space-y-4">
      {/* Top Row - Search & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Search name, email, company..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
            hasActiveFilters 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Filter size={16} />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {[search, stage, dateFilter !== "all", companyFilter].filter(Boolean).length}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="px-3 py-2.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-2 text-sm"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Stage Pills - Always Visible */}
      <div className="flex flex-wrap gap-2">
        {stages.map(s => (
          <button
            key={s || "all"}
            onClick={() => onStageChange(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              stage === s 
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30" 
                : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
            }`}
          >
            {s === "" ? "All Stages" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Advanced Filters - Expandable */}
      {isExpanded && (
        <div className="grid md:grid-cols-2 gap-3 pt-2 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Date Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <Calendar size={14} />
              Created Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all" className="bg-gray-800">All Time</option>
              <option value="today" className="bg-gray-800">Today</option>
              <option value="week" className="bg-gray-800">Last 7 Days</option>
              <option value="month" className="bg-gray-800">Last 30 Days</option>
            </select>
          </div>

          {/* Company Filter */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <Building size={14} />
              Company
            </label>
            <select
              value={companyFilter}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="" className="bg-gray-800">All Companies</option>
              {companies.map(company => (
                <option key={company} value={company} className="bg-gray-800">
                  {company}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}