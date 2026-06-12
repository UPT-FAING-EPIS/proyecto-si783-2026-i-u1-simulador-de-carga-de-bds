import { useEffect, useRef, useState } from 'react'
import { Activity, Users, Shield, Circle, Database, Zap, LogOut, AlertTriangle } from 'lucide-react'
import { subscribeToSimulatorSessions, type SimulatorSession } from './lib/simulatorSession'
import AdminLogin from './components/AdminLogin'
import { signOut } from 'firebase/auth'
import { auth } from './lib/firebase'

// ─── Allowed admin emails (set VITE_ADMIN_EMAILS in Netlify env vars) ─────────
// Format: "email1@gmail.com,email2@gmail.com"

function isAllowed(email: string): boolean {
  const raw = import.meta.env.VITE_ADMIN_EMAILS as string | undefined
  if (!raw) return false
  return raw.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

// ─── Engine / query type styles ───────────────────────────────────────────────

const ENGINE_COLORS: Record<string, string> = {
  sqlserver:  'bg-blue-900/40 text-blue-300 border-blue-700/50',
  mysql:      'bg-orange-900/40 text-orange-300 border-orange-700/50',
  postgresql: 'bg-sky-900/40 text-sky-300 border-sky-700/50',
  oracle:     'bg-red-900/40 text-red-300 border-red-700/50',
  sqlite:     'bg-teal-900/40 text-teal-300 border-teal-700/50',
  mongodb:    'bg-green-900/40 text-green-300 border-green-700/50',
  redis:      'bg-rose-900/40 text-rose-300 border-rose-700/50',
}
const ENGINE_LABELS: Record<string, string> = {
  sqlserver: 'SQL Server', mysql: 'MySQL', postgresql: 'PostgreSQL',
  oracle: 'Oracle', sqlite: 'SQLite', mongodb: 'MongoDB', redis: 'Redis',
}
const QT_COLORS: Record<string, string> = {
  SELECT: 'text-blue-400 border-blue-700/50 bg-blue-900/30',
  INSERT: 'text-green-400 border-green-700/50 bg-green-900/30',
  UPDATE: 'text-amber-400 border-amber-700/50 bg-amber-900/30',
  DELETE: 'text-red-400 border-red-700/50 bg-red-900/30',
}

// ─── Status dot ──────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: SimulatorSession['status'] }) {
  if (status === 'running') return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
  )
  if (status === 'completed') return <Circle size={10} className="text-sky-400 fill-sky-400" />
  return <Circle size={10} className="text-slate-600 fill-slate-600" />
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-surface-700 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-white tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Session card (mobile) ────────────────────────────────────────────────────

function SessionCard({ s, sinceNow }: { s: SimulatorSession; sinceNow: (ts: number | null) => string }) {
  const activeQTs = Object.entries(s.queryTypes).filter(([, v]) => v).map(([k]) => k)
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={s.status} />
          <span className="font-semibold text-white">{s.name}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${ENGINE_COLORS[s.engine] ?? 'bg-surface-700 text-slate-300 border-surface-500'}`}>
          {ENGINE_LABELS[s.engine] ?? s.engine}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {activeQTs.length === 0
          ? <span className="text-xs text-slate-600">Sin operaciones activas</span>
          : activeQTs.map(qt => (
            <span key={qt} className={`text-[11px] px-1.5 py-0.5 rounded border font-semibold ${QT_COLORS[qt] ?? ''}`}>{qt}</span>
          ))
        }
      </div>

      {s.status === 'running' && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-surface-700 rounded-lg p-2">
            <p className="text-[10px] text-slate-500">TPS</p>
            <p className={`text-sm font-bold ${s.tps > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>{s.tps}</p>
          </div>
          <div className="bg-surface-700 rounded-lg p-2">
            <p className="text-[10px] text-slate-500">CPU</p>
            <p className={`text-sm font-bold ${s.cpuUsage >= 90 ? 'text-red-400' : s.cpuUsage >= 70 ? 'text-amber-400' : 'text-slate-300'}`}>{s.cpuUsage.toFixed(0)}%</p>
          </div>
          <div className="bg-surface-700 rounded-lg p-2">
            <p className="text-[10px] text-slate-500">Usuarios</p>
            <p className="text-sm font-bold text-white">{s.currentUsers}<span className="text-slate-500 text-xs">/{s.maxUsers}</span></p>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-600">Conectado {sinceNow(s.connectedAt)}</p>
    </div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ adminEmail, onLogout }: { adminEmail: string; onLogout: () => void }) {
  const [sessions, setSessions] = useState<SimulatorSession[]>([])
  const [, setTick] = useState(0)

  useEffect(() => {
    const unsub = subscribeToSimulatorSessions(setSessions)
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  function sinceNow(ts: number | null): string {
    if (!ts) return '—'
    const secs = Math.floor((Date.now() - ts) / 1000)
    if (secs < 60) return `hace ${secs}s`
    if (secs < 3600) return `hace ${Math.floor(secs / 60)}m`
    return `hace ${Math.floor(secs / 3600)}h`
  }

  const running   = sessions.filter(s => s.status === 'running').length
  const idle      = sessions.filter(s => s.status === 'idle').length
  const completed = sessions.filter(s => s.status === 'completed').length
  const avgTps    = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.tps, 0) / sessions.length) : 0

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">

      {/* Header */}
      <header className="bg-surface-800 border-b border-surface-600 px-4 sm:px-6 py-3.5 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
          <Shield size={15} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-white">Panel Docente</h1>
          <p className="text-[11px] text-slate-500 truncate">{adminEmail}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            En vivo
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-surface-700">
            <LogOut size={13} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Users size={16} className="text-violet-400" />} label="Conectados" value={sessions.length} />
          <StatCard icon={<Activity size={16} className="text-emerald-400" />} label="Simulando" value={running} sub={`${idle} inactivos · ${completed} fin.`} />
          <StatCard icon={<Zap size={16} className="text-amber-400" />} label="TPS promedio" value={avgTps} sub="trans/seg" />
          <StatCard icon={<Database size={16} className="text-sky-400" />} label="Motores activos" value={new Set(sessions.filter(s => s.status === 'running').map(s => s.engine)).size} />
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 bg-surface-800 border border-surface-600 rounded-2xl">
            <Users size={32} className="opacity-30" />
            <p className="text-sm">Sin usuarios conectados aún</p>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {sessions.map(s => <SessionCard key={s.id} s={s} sinceNow={sinceNow} />)}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden sm:block bg-surface-800 border border-surface-600 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-surface-600 flex items-center gap-2">
                <Users size={14} className="text-slate-400" />
                <span className="text-sm font-semibold text-white">Usuarios conectados</span>
                <span className="ml-auto text-xs text-slate-500">{sessions.length} sesiones</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-600 text-left">
                      {['Estado','Usuario','Motor','Operaciones','Usuarios','TPS','CPU','Latencia','Conectado'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-xs text-slate-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => {
                      const activeQTs = Object.entries(s.queryTypes).filter(([, v]) => v).map(([k]) => k)
                      return (
                        <tr key={s.id} className="border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <StatusDot status={s.status} />
                              <span className={`text-xs ${s.status === 'running' ? 'text-emerald-400' : s.status === 'completed' ? 'text-sky-400' : 'text-slate-500'}`}>
                                {s.status === 'running' ? 'Corriendo' : s.status === 'completed' ? 'Finalizado' : 'Inactivo'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${ENGINE_COLORS[s.engine] ?? 'bg-surface-700 text-slate-300 border-surface-500'}`}>
                              {ENGINE_LABELS[s.engine] ?? s.engine}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {activeQTs.length === 0
                                ? <span className="text-xs text-slate-600">—</span>
                                : activeQTs.map(qt => <span key={qt} className={`text-[11px] px-1.5 py-0.5 rounded border font-semibold ${QT_COLORS[qt] ?? ''}`}>{qt}</span>)
                              }
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                            {s.status === 'running' ? <><span className="font-semibold text-white">{s.currentUsers}</span><span className="text-slate-500">/{s.maxUsers}</span></> : '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className={`font-semibold ${s.tps > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>{s.status === 'running' ? s.tps : '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {s.status === 'running'
                              ? <span className={`font-semibold ${s.cpuUsage >= 90 ? 'text-red-400' : s.cpuUsage >= 70 ? 'text-amber-400' : 'text-slate-300'}`}>{s.cpuUsage.toFixed(0)}%</span>
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {s.status === 'running'
                              ? <span className={`font-semibold ${s.latency > 200 ? 'text-red-400' : 'text-slate-300'}`}>{s.latency.toFixed(0)}ms</span>
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500 tabular-nums">{sinceNow(s.connectedAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// ─── Admin App ────────────────────────────────────────────────────────────────

export default function AdminApp() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [denied,     setDenied]     = useState(false)

  useEffect(() => {
    document.documentElement.classList.remove('light')
  }, [])

  function handleAuth(email: string) {
    if (isAllowed(email)) {
      setAdminEmail(email)
      setDenied(false)
    } else {
      setDenied(true)
    }
  }

  async function handleLogout() {
    if (auth) await signOut(auth).catch(() => {})
    setAdminEmail(null)
    setDenied(false)
  }

  if (denied) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-surface-800 border border-red-800/50 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-xl bg-red-900/40 flex items-center justify-center">
            <AlertTriangle size={26} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Acceso denegado</h2>
            <p className="text-slate-400 text-sm mt-1">Tu cuenta no tiene permisos para acceder al panel docente.</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-white transition-colors underline">
            Intentar con otra cuenta
          </button>
        </div>
      </div>
    )
  }

  if (!adminEmail) return <AdminLogin onAuth={handleAuth} />

  return <Dashboard adminEmail={adminEmail} onLogout={handleLogout} />
}
