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
  SELECT: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  INSERT: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  UPDATE: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
}

function StatusDot({ status }: { status: SimulatorSession['status'] }) {
  if (status === 'running') return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
  )
  if (status === 'completed') return <Circle size={10} className="text-slate-400 fill-slate-400 shrink-0" />
  return <Circle size={10} className="text-slate-600 fill-slate-600 shrink-0" />
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent: string
}) {
  return (
    <div className="relative bg-[#1c1f2e] border border-white/8 rounded-2xl p-5 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white tabular-nums leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
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
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Users size={15} className="text-indigo-400" />}   accent="bg-indigo-500" label="Conectados"     value={sessions.length} />
        <StatCard icon={<Activity size={15} className="text-emerald-400" />} accent="bg-emerald-500" label="Simulando" value={running} sub={`${sessions.filter(s => s.status === 'idle').length} inactivos`} />
        <StatCard icon={<Zap size={15} className="text-amber-400" />}      accent="bg-amber-500"   label="TPS promedio"  value={avgTps} sub="trans / seg" />
        <StatCard icon={<Database size={15} className="text-sky-400" />}   accent="bg-sky-500"     label="Motores activos" value={engines} />
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[#1c1f2e] border border-white/8 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
            <Activity size={26} className="text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-slate-300 font-medium">Sin sesiones activas</p>
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
                <div key={s.id} className="bg-[#1c1f2e] border border-white/8 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusDot status={s.status} />
                      <span className="font-semibold text-white">{s.name}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 font-medium">
                      {ENGINE_LABELS[s.engine] ?? s.engine}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {activeQTs.length === 0
                      ? <span className="text-xs text-slate-600">Sin operaciones</span>
                      : activeQTs.map(qt => <span key={qt} className={`text-[11px] px-1.5 py-0.5 rounded border font-semibold ${QT_STYLE[qt] ?? ''}`}>{qt}</span>)
                    }
                  </div>
                  {s.status === 'running' && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        ['TPS',      s.tps,                         s.tps > 200 ? 'text-amber-400' : 'text-emerald-400'],
                        ['CPU',      `${s.cpuUsage.toFixed(0)}%`,   s.cpuUsage >= 90 ? 'text-red-400' : 'text-slate-200'],
                        ['Usuarios', `${s.currentUsers}/${s.maxUsers}`, 'text-slate-200'],
                      ].map(([l, v, c]) => (
                        <div key={String(l)} className="bg-white/5 rounded-lg p-2">
                          <p className="text-[10px] text-slate-500">{l}</p>
                          <p className={`text-sm font-bold ${c}`}>{v}</p>
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
          <div className="hidden sm:block bg-[#1c1f2e] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Sesiones en tiempo real</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold border border-indigo-500/25">
                {sessions.length} activas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6 bg-white/2">
                    {['Estado','Usuario','Motor','Operaciones','Usuarios','TPS','CPU','Latencia','Tiempo'].map(h => (
                      <th key={h} className="px-4 py-3 text-[11px] text-slate-500 font-semibold text-left uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sessions.map(s => {
                    const activeQTs = Object.entries(s.queryTypes).filter(([, v]) => v).map(([k]) => k)
                    return (
                      <tr key={s.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <StatusDot status={s.status} />
                            <span className={`text-xs font-semibold ${
                              s.status === 'running' ? 'text-emerald-400' :
                              s.status === 'completed' ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {s.status === 'running' ? 'Corriendo' : s.status === 'completed' ? 'Finalizado' : 'Inactivo'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-white">{s.name}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-300 font-medium">
                            {ENGINE_LABELS[s.engine] ?? s.engine}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1 flex-wrap">
                            {activeQTs.length === 0 ? <span className="text-xs text-slate-600">—</span>
                              : activeQTs.map(qt => (
                                <span key={qt} className={`text-[11px] px-1.5 py-0.5 rounded border font-semibold ${QT_STYLE[qt] ?? ''}`}>{qt}</span>
                              ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">
                          {s.status === 'running'
                            ? <><span className="font-semibold text-white">{s.currentUsers}</span><span className="text-slate-500 text-xs">/{s.maxUsers}</span></>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">
                          <span className={`font-semibold ${s.tps > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {s.status === 'running' ? s.tps : <span className="text-slate-600">—</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">
                          {s.status === 'running'
                            ? <span className={`font-semibold ${s.cpuUsage >= 90 ? 'text-red-400' : s.cpuUsage >= 70 ? 'text-amber-400' : 'text-slate-200'}`}>{s.cpuUsage.toFixed(0)}%</span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3.5 tabular-nums">
                          {s.status === 'running'
                            ? <span className={`font-semibold ${s.latency > 200 ? 'text-red-400' : 'text-slate-200'}`}>{s.latency.toFixed(0)}ms</span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 tabular-nums">{sinceNow(s.connectedAt)}</td>
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
        className={`appearance-none pr-7 pl-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer outline-none transition-all disabled:opacity-60
          ${isAdmin
            ? 'bg-indigo-500/15 border-indigo-500/35 text-indigo-300 hover:bg-indigo-500/25'
            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/8'
          }`}
      >
        <option value="Usuario">Usuario</option>
        <option value="Administrador">Administrador</option>
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-800/80 rounded-lg">
          <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
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
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users size={15} className="text-indigo-400" />}   accent="bg-indigo-500"  label="Total usuarios"     value={users.length} />
        <StatCard icon={<Shield size={15} className="text-violet-400" />}  accent="bg-violet-500"  label="Administradores"    value={admins} />
        <StatCard icon={<UserCog size={15} className="text-sky-400" />}    accent="bg-sky-500"     label="Usuarios regulares" value={regular} />
      </div>

      <div className="bg-[#1c1f2e] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3 flex-wrap">
          <UserCog size={15} className="text-slate-400 shrink-0" />
          <span className="text-sm font-semibold text-white">Gestión de usuarios</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="ml-auto bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all w-full sm:w-60"
          />
        </div>

        {/* Mobile cards */}
        <div className="flex flex-col divide-y divide-white/5 sm:hidden">
          {filtered.map(u => (
            <div key={u.uid} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
                    style={{ background: u.color }}>
                    {u.username[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.username}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>
                <RoleSelector uid={u.uid} currentRole={u.role} loading={loading} onChange={handleRoleChange} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400">
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
              <tr className="border-b border-white/6 bg-white/2">
                {['Usuario','Correo','Proveedor','Registrado','Rol'].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] text-slate-500 font-semibold text-left uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => (
                <tr key={u.uid} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: u.color }}>
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-white">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-300 font-medium">
                      {u.provider === 'google' ? 'Google' : 'Email'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <RoleSelector uid={u.uid} currentRole={u.role} loading={loading} onChange={handleRoleChange} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-600">
            <Users size={28} className="opacity-30" />
            <p className="text-sm">No se encontraron usuarios</p>
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
    <div className="min-h-screen bg-[#0e1118] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-indigo-500/40 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Verificando permisos...</p>
      </div>
    </div>
  )

  if (denied) return (
    <div className="min-h-screen bg-[#0e1118] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1c1f2e] border border-red-500/20 rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">Acceso denegado</h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">Tu cuenta no tiene permisos para acceder al panel de control.</p>
        </div>
        <button onClick={handleLogout}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
          Intentar con otra cuenta
        </button>
      </div>
    </div>
  )

  if (!adminEmail) return <AdminLogin onAuth={handleAuth} />

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e1118' }}>

      {/* Header */}
      <header className="border-b border-white/8 px-4 sm:px-6 py-3.5 flex items-center gap-3 shrink-0"
        style={{ background: 'rgba(20,22,32,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
          <Shield size={14} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-white tracking-tight">Centro de Control</h1>
          <p className="text-[11px] text-slate-500 truncate">{adminEmail}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 mr-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline font-medium">En vivo</span>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all px-3 py-1.5 rounded-lg border border-white/8 hover:border-white/15 hover:bg-white/5">
          <LogOut size={13} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/8 px-4 sm:px-6 flex"
        style={{ background: 'rgba(20,22,32,0.7)' }}>
        {([
          { key: 'monitor', label: 'Monitoreo', icon: <Activity size={13} /> },
          { key: 'users',   label: 'Usuarios',  icon: <Users size={13} /> },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
            }`}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-auto p-4 sm:p-6 max-w-screen-xl mx-auto w-full">
        {activeTab === 'monitor' ? <TabMonitoreo /> : <TabUsuarios />}
      </main>
    </div>
  )
}
