import { useEffect, useState } from 'react'
import {
  Activity, Users, Shield, Circle, Database,
  Zap, LogOut, AlertTriangle, UserCog, ChevronDown,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from './lib/firebase'
import { subscribeToSimulatorSessions, type SimulatorSession } from './lib/simulatorSession'
import { subscribeToUsers, updateUserRole, isAdminByUid, type ManagedUser } from './lib/adminUsers'
import AdminLogin from './components/AdminLogin'

function isStaticAdmin(email: string): boolean {
  const raw = import.meta.env.VITE_ADMIN_EMAILS as string | undefined
  if (!raw) return false
  return raw.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase())
}

const ENGINE_LABELS: Record<string, string> = {
  sqlserver: 'SQL Server', mysql: 'MySQL', postgresql: 'PostgreSQL',
  oracle: 'Oracle', sqlite: 'SQLite', mongodb: 'MongoDB', redis: 'Redis',
}

const QT_STYLE: Record<string, string> = {
  SELECT: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  INSERT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  UPDATE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  DELETE: 'bg-red-500/20 text-red-300 border-red-500/40',
}

function StatusDot({ status }: { status: SimulatorSession['status'] }) {
  if (status === 'running') return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
  )
  if (status === 'completed') return <Circle size={10} className="text-slate-500 fill-slate-500 shrink-0" />
  return <Circle size={10} className="text-slate-700 fill-slate-700 shrink-0" />
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  iconBg: string
  valueCls: string
}

function StatCard({ icon, label, value, sub, iconBg, valueCls }: StatCardProps) {
  return (
    <div className="bg-[#161b27] border border-[#2a3042] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className={`text-4xl font-extrabold tabular-nums leading-none ${valueCls}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1.5 font-medium">{sub}</p>}
      </div>
    </div>
  )
}

function TabMonitoreo() {
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
    const s = Math.floor((Date.now() - ts) / 1000)
    if (s < 60) return `${s}s`
    if (s < 3600) return `${Math.floor(s / 60)}m`
    return `${Math.floor(s / 3600)}h`
  }

  const running = sessions.filter(s => s.status === 'running').length
  const avgTps  = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.tps, 0) / sessions.length) : 0
  const engines = new Set(sessions.filter(s => s.status === 'running').map(s => s.engine)).size

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={16} className="text-indigo-300" />}
          iconBg="bg-indigo-500/20"
          label="Conectados"
          value={sessions.length}
          valueCls="text-indigo-400"
        />
        <StatCard
          icon={<Activity size={16} className="text-emerald-300" />}
          iconBg="bg-emerald-500/20"
          label="Simulando"
          value={running}
          sub={`${sessions.filter(s => s.status === 'idle').length} inactivos`}
          valueCls="text-emerald-400"
        />
        <StatCard
          icon={<Zap size={16} className="text-amber-300" />}
          iconBg="bg-amber-500/20"
          label="TPS promedio"
          value={avgTps}
          sub="transacciones / seg"
          valueCls="text-amber-400"
        />
        <StatCard
          icon={<Database size={16} className="text-sky-300" />}
          iconBg="bg-sky-500/20"
          label="Motores activos"
          value={engines}
          valueCls="text-sky-400"
        />
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 bg-[#161b27] border border-[#2a3042] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/40 flex items-center justify-center">
            <Activity size={28} className="text-slate-500" />
          </div>
          <div className="text-center">
            <p className="text-slate-300 font-semibold text-base">Sin sesiones activas</p>
            <p className="text-slate-500 text-sm mt-1">Los usuarios aparecerán aquí en tiempo real</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {sessions.map(s => {
              const activeQTs = Object.entries(s.queryTypes).filter(([, v]) => v).map(([k]) => k)
              return (
                <div key={s.id} className="bg-[#161b27] border border-[#2a3042] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusDot status={s.status} />
                      <span className="font-bold text-white">{s.name}</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-[#1e2436] border border-[#2a3042] text-slate-300 font-semibold">
                      {ENGINE_LABELS[s.engine] ?? s.engine}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeQTs.length === 0
                      ? <span className="text-xs text-slate-600">Sin operaciones</span>
                      : activeQTs.map(qt => <span key={qt} className={`text-[11px] px-2 py-0.5 rounded border font-bold ${QT_STYLE[qt] ?? ''}`}>{qt}</span>)
                    }
                  </div>
                  {s.status === 'running' && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        ['TPS', s.tps, s.tps > 200 ? 'text-amber-400' : 'text-emerald-400'],
                        ['CPU', `${s.cpuUsage.toFixed(0)}%`, s.cpuUsage >= 90 ? 'text-red-400' : 'text-slate-200'],
                        ['Usuarios', `${s.currentUsers}/${s.maxUsers}`, 'text-slate-200'],
                      ].map(([l, v, c]) => (
                        <div key={String(l)} className="bg-[#1a2035] rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{l}</p>
                          <p className={`text-sm font-extrabold mt-0.5 ${c}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-600">Conectado hace {sinceNow(s.connectedAt)}</p>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-[#161b27] border border-[#2a3042] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2a3042] flex items-center gap-3">
              <Activity size={15} className="text-indigo-400 shrink-0" />
              <span className="text-sm font-bold text-white">Sesiones en tiempo real</span>
              <span className="ml-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                {sessions.length} activas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a3042] bg-[#111520]">
                    {['Estado','Usuario','Motor','Operaciones','Usuarios','TPS','CPU','Latencia','Tiempo'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[11px] text-slate-500 font-bold text-left uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2436]">
                  {sessions.map(s => {
                    const activeQTs = Object.entries(s.queryTypes).filter(([, v]) => v).map(([k]) => k)
                    return (
                      <tr key={s.id} className="hover:bg-[#1a2035] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <StatusDot status={s.status} />
                            <span className={`text-xs font-bold ${
                              s.status === 'running' ? 'text-emerald-400' :
                              s.status === 'completed' ? 'text-slate-500' : 'text-slate-600'
                            }`}>
                              {s.status === 'running' ? 'Corriendo' : s.status === 'completed' ? 'Finalizado' : 'Inactivo'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold text-white">{s.name}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-[#1e2436] border border-[#2a3042] text-slate-300 font-semibold">
                            {ENGINE_LABELS[s.engine] ?? s.engine}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {activeQTs.length === 0
                              ? <span className="text-xs text-slate-600">—</span>
                              : activeQTs.map(qt => (
                                <span key={qt} className={`text-[11px] px-2 py-0.5 rounded border font-bold ${QT_STYLE[qt] ?? ''}`}>{qt}</span>
                              ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 tabular-nums">
                          {s.status === 'running'
                            ? <><span className="font-bold text-white">{s.currentUsers}</span><span className="text-slate-500 text-xs">/{s.maxUsers}</span></>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-4 tabular-nums">
                          {s.status === 'running'
                            ? <span className={`font-extrabold text-base ${s.tps > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>{s.tps}</span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-4 tabular-nums">
                          {s.status === 'running'
                            ? <span className={`font-bold ${s.cpuUsage >= 90 ? 'text-red-400' : s.cpuUsage >= 70 ? 'text-amber-400' : 'text-slate-200'}`}>{s.cpuUsage.toFixed(0)}%</span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-4 tabular-nums">
                          {s.status === 'running'
                            ? <span className={`font-bold ${s.latency > 200 ? 'text-red-400' : 'text-slate-200'}`}>{s.latency.toFixed(0)}ms</span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 tabular-nums">{sinceNow(s.connectedAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function RoleSelector({ uid, currentRole, loading, onChange }: {
  uid: string; currentRole: string; loading: string | null
  onChange: (uid: string, role: 'Usuario' | 'Administrador') => void
}) {
  const isAdmin = currentRole === 'Administrador'
  const busy    = loading === uid

  return (
    <div className="relative">
      <select
        value={currentRole}
        disabled={busy}
        onChange={e => onChange(uid, e.target.value as 'Usuario' | 'Administrador')}
        className={`appearance-none pr-7 pl-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer outline-none transition-all disabled:opacity-60
          ${isAdmin
            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30'
            : 'bg-[#1e2436] border-[#2a3042] text-slate-400 hover:bg-[#232b40] hover:text-slate-300'
          }`}
      >
        <option value="Usuario">Usuario</option>
        <option value="Administrador">Administrador</option>
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#161b27]/80 rounded-lg">
          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

function TabUsuarios() {
  const [users,   setUsers]   = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    const unsub = subscribeToUsers(setUsers)
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  async function handleRoleChange(uid: string, newRole: 'Usuario' | 'Administrador') {
    setLoading(uid)
    try { await updateUserRole(uid, newRole) }
    finally { setLoading(null) }
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const admins  = users.filter(u => u.role === 'Administrador').length
  const regular = users.filter(u => u.role !== 'Administrador').length

  function formatDate(ts: number) {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Users size={16} className="text-indigo-300" />}
          iconBg="bg-indigo-500/20"
          label="Total usuarios"
          value={users.length}
          valueCls="text-indigo-400"
        />
        <StatCard
          icon={<Shield size={16} className="text-violet-300" />}
          iconBg="bg-violet-500/20"
          label="Administradores"
          value={admins}
          valueCls="text-violet-400"
        />
        <StatCard
          icon={<UserCog size={16} className="text-sky-300" />}
          iconBg="bg-sky-500/20"
          label="Usuarios regulares"
          value={regular}
          valueCls="text-sky-400"
        />
      </div>

      <div className="bg-[#161b27] border border-[#2a3042] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a3042] flex items-center gap-3 flex-wrap">
          <UserCog size={15} className="text-indigo-400 shrink-0" />
          <span className="text-sm font-bold text-white">Gestión de usuarios</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="ml-auto bg-[#111520] border border-[#2a3042] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500/60 transition-all w-full sm:w-64"
          />
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col divide-y divide-[#1e2436] sm:hidden">
          {filtered.map(u => (
            <div key={u.uid} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-extrabold text-white"
                    style={{ background: u.color }}>
                    {u.username[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{u.username}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>
                <RoleSelector uid={u.uid} currentRole={u.role} loading={loading} onChange={handleRoleChange} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="px-2.5 py-1 rounded-lg border border-[#2a3042] bg-[#1e2436] text-slate-400 font-semibold">
                  {u.provider === 'google' ? 'Google' : 'Email'}
                </span>
                <span>{formatDate(u.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a3042] bg-[#111520]">
                {['Usuario','Correo','Proveedor','Registrado','Rol'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] text-slate-500 font-bold text-left uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2436]">
              {filtered.map(u => (
                <tr key={u.uid} className="hover:bg-[#1a2035] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                        style={{ background: u.color }}>
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <span className="font-bold text-white">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs font-medium">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-[#1e2436] border border-[#2a3042] text-slate-300 font-semibold">
                      {u.provider === 'google' ? 'Google' : 'Email'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 font-medium">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-4">
                    <RoleSelector uid={u.uid} currentRole={u.role} loading={loading} onChange={handleRoleChange} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users size={30} className="text-slate-700" />
            <p className="text-sm text-slate-500">No se encontraron usuarios</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminApp() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [denied,     setDenied]     = useState(false)
  const [checking,   setChecking]   = useState(false)
  const [activeTab,  setActiveTab]  = useState<'monitor' | 'users'>('monitor')

  useEffect(() => { document.documentElement.classList.remove('light') }, [])

  async function handleAuth(email: string, uid: string) {
    if (isStaticAdmin(email)) { setAdminEmail(email); return }
    setChecking(true)
    const ok = await isAdminByUid(uid)
    setChecking(false)
    if (ok) { setAdminEmail(email) } else { setDenied(true) }
  }

  async function handleLogout() {
    if (auth) await signOut(auth).catch(() => {})
    setAdminEmail(null)
    setDenied(false)
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b0f1a' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Verificando permisos...</p>
      </div>
    </div>
  )

  if (denied) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0b0f1a' }}>
      <div className="w-full max-w-sm bg-[#161b27] border border-red-500/25 rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-white font-extrabold text-xl">Acceso denegado</h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">Tu cuenta no tiene permisos para acceder al panel de control.</p>
        </div>
        <button onClick={handleLogout}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
          Intentar con otra cuenta
        </button>
      </div>
    </div>
  )

  if (!adminEmail) return <AdminLogin onAuth={handleAuth} />

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0b0f1a' }}>

      {/* Header */}
      <header className="border-b border-[#1e2740] px-5 sm:px-8 py-4 flex items-center gap-4 shrink-0"
        style={{ background: '#0f1422' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
          <Shield size={16} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-extrabold text-white tracking-tight">Centro de Control</h1>
          <p className="text-[11px] text-slate-500 truncate font-medium">{adminEmail}</p>
        </div>
        <div className="flex items-center gap-2 mr-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-emerald-400 font-semibold">En vivo</span>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-all px-3.5 py-2 rounded-xl border border-[#2a3042] hover:border-slate-500 hover:bg-white/5 font-semibold">
          <LogOut size={13} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-[#1e2740] px-5 sm:px-8 flex" style={{ background: '#0d1220' }}>
        {([
          { key: 'monitor', label: 'Monitoreo', icon: <Activity size={13} /> },
          { key: 'users',   label: 'Usuarios',  icon: <Users size={13} /> },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
            }`}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-auto p-5 sm:p-8 max-w-screen-xl mx-auto w-full">
        {activeTab === 'monitor' ? <TabMonitoreo /> : <TabUsuarios />}
      </main>
    </div>
  )
}
