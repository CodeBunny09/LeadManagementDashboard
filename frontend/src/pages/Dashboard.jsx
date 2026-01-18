import React, { useEffect, useMemo, useState } from "react"
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { 
  Users, Mail, Building, TrendingUp, TrendingDown, Activity, 
  AlertCircle, Clock, Target, Zap, Award, ArrowUpRight, ArrowDownRight,
  Calendar, Percent, Eye, EyeOff, Filter, BarChart3
} from "lucide-react"
import API from "../services/api"

const stageColors = {
  new: "#3b82f6",
  contacted: "#f59e0b",
  qualified: "#8b5cf6",
  converted: "#10b981"
}

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: "rgba(15, 23, 42, 0.95)",
  border: "1px solid rgba(148, 163, 184, 0.3)",
  borderRadius: "8px",
  padding: "12px"
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [history, setHistory] = useState([])
  const [days, setDays] = useState(30)
  const [authError, setAuthError] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [maxDays, setMaxDays] = useState(180)

  useEffect(() => {
    Promise.all([
      API.get("/api/analytics"),
      API.get("/api/analytics/history")
    ]).then(([a, h]) => {
      setAnalytics(a.data)
      setHistory(h.data)
      
      // Calculate max days from oldest record
      if (h.data.length > 0) {
        const oldestDate = new Date(Math.min(...h.data.map(item => new Date(item.createdAt))))
        const daysDiff = Math.ceil((Date.now() - oldestDate) / (1000 * 60 * 60 * 24))
        setMaxDays(daysDiff)
      }
      
      setAuthError(false)
    }).catch(err => {
      if (err.response?.status === 401) {
        setAuthError(true)
      }
    })
  }, [])

  /* ========================= FILTERED DATA LAYER ========================= */
  const filteredHistory = useMemo(() => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return history.filter(h => new Date(h.createdAt).getTime() >= cutoff)
  }, [history, days])

  const filteredStageCounts = useMemo(() => {
    const counts = { new: 0, contacted: 0, qualified: 0, converted: 0 }
    filteredHistory.forEach(h => {
      const stage = h.newStage || h.stage
      if (stage && counts.hasOwnProperty(stage)) {
        counts[stage]++
      }
    })
    return counts
  }, [filteredHistory])

  const filteredTotalLeads = useMemo(() => filteredHistory.length, [filteredHistory])
  const filteredConvertedLeads = useMemo(() => filteredStageCounts.converted, [filteredStageCounts])
  const filteredConversionRate = useMemo(() => {
    if (filteredTotalLeads === 0) return 0
    return Math.round((filteredConvertedLeads / filteredTotalLeads) * 100)
  }, [filteredTotalLeads, filteredConvertedLeads])

  /* ========================= TIME SERIES DATA ========================= */
  const historyData = useMemo(() => {
    const grouped = {}
    filteredHistory.forEach(h => {
      const d = new Date(h.createdAt)
      if (isNaN(d)) return
      const day = d.toISOString().slice(0, 10)
      grouped[day] = (grouped[day] || 0) + 1
    })
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [filteredHistory])

  /* ========================= CONVERSION FLOW (NOT JUST COUNTS) ========================= */
  const conversionFlow = useMemo(() => {
    // Track how leads move through stages
    const flow = {
      newToContacted: 0,
      newStuck: 0,
      contactedToQualified: 0,
      contactedStuck: 0,
      qualifiedToConverted: 0,
      qualifiedStuck: 0
    }
    
    // Group by leadId to track progression
    const leadProgression = {}
    filteredHistory.forEach(h => {
      if (!leadProgression[h.leadId]) {
        leadProgression[h.leadId] = []
      }
      leadProgression[h.leadId].push(h.newStage || h.stage)
    })
    
    // Analyze each lead's journey
    Object.values(leadProgression).forEach(stages => {
      const finalStage = stages[stages.length - 1]
      
      if (stages.includes('contacted')) {
        flow.newToContacted++
        if (stages.includes('qualified')) {
          flow.contactedToQualified++
          if (stages.includes('converted')) {
            flow.qualifiedToConverted++
          } else {
            flow.qualifiedStuck++
          }
        } else {
          flow.contactedStuck++
        }
      } else {
        flow.newStuck++
      }
    })
    
    return [
      { name: 'New → Contacted', value: flow.newToContacted, color: '#3b82f6' },
      { name: 'Contacted → Qualified', value: flow.contactedToQualified, color: '#f59e0b' },
      { name: 'Qualified → Converted', value: flow.qualifiedToConverted, color: '#10b981' },
      { name: 'Drop-offs', value: flow.newStuck + flow.contactedStuck + flow.qualifiedStuck, color: '#ef4444' }
    ]
  }, [filteredHistory])

  /* ========================= VELOCITY METRICS ========================= */
  const velocityMetrics = useMemo(() => {
    const leadTimeline = {}
    
    filteredHistory.forEach(h => {
      if (!leadTimeline[h.leadId]) {
        leadTimeline[h.leadId] = {}
      }
      leadTimeline[h.leadId][h.newStage || h.stage] = new Date(h.createdAt)
    })
    
    const velocities = {
      newToContacted: [],
      contactedToQualified: [],
      qualifiedToConverted: []
    }
    
    Object.values(leadTimeline).forEach(timeline => {
      if (timeline.new && timeline.contacted) {
        const days = (timeline.contacted - timeline.new) / (1000 * 60 * 60 * 24)
        velocities.newToContacted.push(days)
      }
      if (timeline.contacted && timeline.qualified) {
        const days = (timeline.qualified - timeline.contacted) / (1000 * 60 * 60 * 24)
        velocities.contactedToQualified.push(days)
      }
      if (timeline.qualified && timeline.converted) {
        const days = (timeline.converted - timeline.qualified) / (1000 * 60 * 60 * 24)
        velocities.qualifiedToConverted.push(days)
      }
    })
    
    const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    
    return [
      { stage: 'New → Contacted', avgDays: Math.round(avg(velocities.newToContacted) * 10) / 10 },
      { stage: 'Contacted → Qualified', avgDays: Math.round(avg(velocities.contactedToQualified) * 10) / 10 },
      { stage: 'Qualified → Converted', avgDays: Math.round(avg(velocities.qualifiedToConverted) * 10) / 10 }
    ]
  }, [filteredHistory])

  /* ========================= STAGE OVER TIME ========================= */
  const stageOverTime = useMemo(() => {
    const grouped = {}
    
    filteredHistory.forEach(h => {
      const d = new Date(h.createdAt)
      if (isNaN(d)) return
      const day = d.toISOString().slice(0, 10)
      
      if (!grouped[day]) {
        grouped[day] = { date: day, new: 0, contacted: 0, qualified: 0, converted: 0 }
      }
      
      const stage = h.newStage || h.stage
      if (stage && grouped[day].hasOwnProperty(stage)) {
        grouped[day][stage]++
      }
    })
    
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [filteredHistory])

  /* ========================= CUMULATIVE CONVERSIONS ========================= */
  const cumulativeConversions = useMemo(() => {
    let cumulative = 0
    const conversionHistory = filteredHistory
      .filter(h => (h.newStage || h.stage) === 'converted')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    
    const grouped = {}
    conversionHistory.forEach(h => {
      const day = new Date(h.createdAt).toISOString().slice(0, 10)
      grouped[day] = (grouped[day] || 0) + 1
    })
    
    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, count]) => {
        cumulative += count
        return { date, daily: count, cumulative }
      })
  }, [filteredHistory])

  /* ========================= TREND ANALYSIS ========================= */
  const trendAnalysis = useMemo(() => {
    if (historyData.length < 2) return { direction: "stable", percentage: 0 }
    
    const midpoint = Math.floor(historyData.length / 2)
    const firstHalf = historyData.slice(0, midpoint).reduce((sum, d) => sum + d.count, 0)
    const secondHalf = historyData.slice(midpoint).reduce((sum, d) => sum + d.count, 0)
    
    const avgFirst = firstHalf / midpoint
    const avgSecond = secondHalf / (historyData.length - midpoint)
    const change = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0
    
    return {
      direction: change > 5 ? "up" : change < -5 ? "down" : "stable",
      percentage: Math.abs(Math.round(change))
    }
  }, [historyData])

  /* ========================= PERFORMANCE METRICS ========================= */
  const performanceMetrics = useMemo(() => {
    const avgDailyLeads = historyData.length > 0 
      ? Math.round(filteredTotalLeads / historyData.length) 
      : 0
    
    const bestDay = historyData.length > 0
      ? historyData.reduce((max, d) => d.count > max.count ? d : max, historyData[0])
      : null

    const conversionQuality = filteredStageCounts.qualified > 0
      ? Math.round((filteredStageCounts.converted / filteredStageCounts.qualified) * 100)
      : 0
    
    const contactRate = filteredStageCounts.new > 0
      ? Math.round(((filteredStageCounts.contacted + filteredStageCounts.qualified + filteredStageCounts.converted) / filteredTotalLeads) * 100)
      : 0

    return { avgDailyLeads, bestDay, conversionQuality, contactRate }
  }, [historyData, filteredTotalLeads, filteredStageCounts])

  /* ========================= QUICK TIME FILTERS ========================= */
  const quickFilters = [
    { label: '7d', days: 7 },
    { label: '15d', days: 15 },
    { label: '30d', days: 30 },
    { label: '3m', days: 90 },
    { label: '6m', days: 180 },
    { label: '12m', days: 365 },
    { label: 'All', days: maxDays }
  ]

  if (authError) {
    return (
      <div className="p-8">
        <div className="glass p-6 bg-red-900 bg-opacity-20 border border-red-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-red-400 text-lg mb-2">Authentication Required</h3>
              <p className="text-gray-300 mb-4">You need to log in to access the dashboard.</p>
              <button 
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ===================== DEBUG TOGGLE ===================== */}
      <button 
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 right-4 z-50 glass p-3 rounded-full hover:bg-white/10 transition-all"
        title="Toggle Debug Info"
      >
        {showDebug ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>

      {/* ===================== DEBUG PANEL ===================== */}
      {showDebug && (
        <div className="glass p-4 bg-yellow-900 bg-opacity-20 border border-yellow-500">
          <h3 className="font-bold text-yellow-400 mb-2">🐛 DEBUG INFO</h3>
          <div className="text-xs text-gray-300 space-y-1 font-mono">
            <div>Days Filter: {days} / Max: {maxDays}</div>
            <div>Total History: {history.length}</div>
            <div>Filtered: {filteredHistory.length}</div>
            <div>Stages: {JSON.stringify(filteredStageCounts)}</div>
          </div>
        </div>
      )}

{/* ===================== LIFETIME OVERVIEW ===================== */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Building className="text-purple-400" size={20} />
          Lifetime Overview
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <MetricCard 
            title="Total Leads" 
            value={analytics.totalLeads} 
            icon={<Users />}
            color="blue"
          />
          <MetricCard 
            title="Converted" 
            value={analytics.convertedLeads} 
            icon={<Award />}
            color="green"
          />
          <MetricCard 
            title="Companies" 
            value={analytics.uniqueCompanies} 
            icon={<Building />}
            color="purple"
          />
          <MetricCard 
            title="Success Rate" 
            value={`${analytics.totalLeads > 0 ? Math.round((analytics.convertedLeads / analytics.totalLeads) * 100) : 0}%`} 
            icon={<Percent />}
            color="yellow"
          />
        </div>
      </div>
      {/* ===================== HEADER ===================== */}
      <div className="glass p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="text-yellow-400" size={28} />
              CRM Analytics Dashboard
            </h2>
            <p className="text-gray-400 text-sm mt-1">Deep insights into your sales pipeline</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
            <Calendar size={16} className="text-blue-400" />
            <span className="text-sm">Last {days} days</span>
          </div>
        </div>
        
        {trendAnalysis.direction === "up" && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full text-green-400 inline-flex">
            <ArrowUpRight size={16} />
            <span className="text-sm font-semibold">+{trendAnalysis.percentage}% Growth</span>
          </div>
        )}
        {trendAnalysis.direction === "down" && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full text-red-400 inline-flex">
            <ArrowDownRight size={16} />
            <span className="text-sm font-semibold">-{trendAnalysis.percentage}% Decline</span>
          </div>
        )}
        {trendAnalysis.direction === "stable" && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-blue-400 inline-flex">
            <Activity size={16} />
            <span className="text-sm font-semibold">Stable Activity</span>
          </div>
        )}
      </div>

      {/* ===================== TIME FILTER ===================== */}
      <div className="glass p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter className="text-blue-400" size={18} />
            <h3 className="font-semibold text-white">Time Range Filter</h3>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2">
              {quickFilters.map(filter => (
                <button
                  key={filter.label}
                  onClick={() => setDays(filter.days)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    days === filter.days 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3 flex-1">
              <input
                type="range"
                min="7"
                max={maxDays}
                step="1"
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-400 min-w-[80px]">{days} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== KEY METRICS ===================== */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <BarChart3 className="text-purple-400" size={20} />
          Key Performance Indicators
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <MetricCard 
            title="Total Activity" 
            value={filteredTotalLeads} 
            icon={<Activity />}
            color="blue"
            subtitle={`${performanceMetrics.avgDailyLeads}/day average`}
          />
          <MetricCard 
            title="Contact Rate" 
            value={`${performanceMetrics.contactRate}%`} 
            icon={<Mail />}
            color="orange"
            subtitle="Leads contacted"
          />
          <MetricCard 
            title="Conversion Quality" 
            value={`${performanceMetrics.conversionQuality}%`} 
            icon={<Target />}
            color="purple"
            subtitle="Qualified → Converted"
          />
          <MetricCard 
            title="Total Conversions" 
            value={filteredConvertedLeads} 
            icon={<Award />}
            color="green"
            subtitle={`${filteredConversionRate}% of all leads`}
          />
        </div>
      </div>

      {/* ===================== CONVERSION FLOW (UNIQUE) ===================== */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Target className="text-green-400" size={20} />
          Lead Progression Flow
        </h3>
        <ChartBox title="How leads move through your funnel" subtitle="Shows actual transitions, not just stage counts">
          {conversionFlow.every(d => d.value === 0) ? (
            <EmptyState />
          ) : (
            <BarChart data={conversionFlow} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" width={180} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {conversionFlow.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ChartBox>
      </div>

      {/* ===================== VELOCITY METRICS (UNIQUE) ===================== */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Clock className="text-yellow-400" size={20} />
          Stage Velocity (Time to Progress)
        </h3>
        <ChartBox title="Average days to move between stages" subtitle="Lower is better - shows how fast leads progress">
          {velocityMetrics.every(d => d.avgDays === 0) ? (
            <EmptyState />
          ) : (
            <BarChart data={velocityMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="stage" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Bar dataKey="avgDays" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ChartBox>
      </div>

      {/* ===================== STAGE DISTRIBUTION OVER TIME (UNIQUE) ===================== */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <TrendingUp className="text-blue-400" size={20} />
          Stage Distribution Over Time
        </h3>
        <ChartBox title="Activity by stage each day" subtitle="See which stages are most active on different days">
          {stageOverTime.length === 0 ? (
            <EmptyState />
          ) : (
            <AreaChart data={stageOverTime}>
              <defs>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorContacted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Legend />
              <Area type="monotone" dataKey="new" stackId="1" stroke="#3b82f6" fill="url(#colorNew)" />
              <Area type="monotone" dataKey="contacted" stackId="1" stroke="#f59e0b" fill="url(#colorContacted)" />
              <Area type="monotone" dataKey="qualified" stackId="1" stroke="#8b5cf6" fill="url(#colorQualified)" />
              <Area type="monotone" dataKey="converted" stackId="1" stroke="#10b981" fill="url(#colorConverted)" />
            </AreaChart>
          )}
        </ChartBox>
      </div>

      {/* ===================== CONVERSION PROGRESS (UNIQUE) ===================== */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Award className="text-green-400" size={20} />
          Conversion Progress
        </h3>
        <ChartBox title="Daily vs Cumulative conversions" subtitle="Track your conversion momentum over time">
          {cumulativeConversions.length === 0 ? (
            <EmptyState message="No conversions in selected period" />
          ) : (
            <ComposedChart data={cumulativeConversions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Legend />
              <Bar yAxisId="left" dataKey="daily" fill="#10b981" name="Daily Conversions" radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={3} name="Total Conversions" />
            </ComposedChart>
          )}
        </ChartBox>
      </div>

      
    </div>
  )
}

/* ===================== UI COMPONENTS ===================== */

function MetricCard({ title, value, icon, color = "blue", subtitle }) {
  const colors = {
    blue: "from-blue-600/20 to-blue-600/5 border-blue-500/30",
    green: "from-green-600/20 to-green-600/5 border-green-500/30",
    purple: "from-purple-600/20 to-purple-600/5 border-purple-500/30",
    yellow: "from-yellow-600/20 to-yellow-600/5 border-yellow-500/30",
    orange: "from-orange-600/20 to-orange-600/5 border-orange-500/30"
  }

  const iconColors = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    orange: "text-orange-400"
  }

  return (
    <div className={`glass p-4 bg-gradient-to-br ${colors[color]} relative overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <p className="text-gray-400 text-xs uppercase tracking-wide">{title}</p>
          <div className={iconColors[color]}>{icon}</div>
        </div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="text-6xl">{icon}</div>
      </div>
    </div>
  )
}

function ChartBox({ title, subtitle, children }) {
  return (
    <div className="glass p-5 hover:border-blue-500/30 transition-all">
      <div className="mb-4">
        <h3 className="font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}

function EmptyState({ message = "No data for selected period" }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <AlertCircle size={32} className="mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  )
}