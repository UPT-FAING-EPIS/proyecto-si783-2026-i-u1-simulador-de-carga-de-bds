import { useEffect, useRef, useState } from 'react'
import { Activity, Users, Shield, Circle, Database, Cpu, Zap, Clock } from 'lucide-react'
import { subscribeToSimulatorSessions, type SimulatorSession } from './lib/simulatorSession'

// ─── Engine badge colors ──────────────────────────────────────────────────────

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
  if (status === 'running') {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
    )
  }
  if (status === 'completed') {
    return <Circle size={10} className="text-sky-400 fill-sky-400" />
  }
  return <Circle size={10} className="text-slate-600 fill-slate-600" />
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-surface-700 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-white tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Admin App ────────────────────────────────────────────────────────────────

export default function AdminApp() {
  const [sessions, setSessions] = useState<SimulatorSession[]>([])
  const [tick,     setTick]     = useState(0)
  const isFirstRender = useRef(true)

  useEffect(() => {
    document.documentElement.classList.remove('light')
  }, [])

  useEffect(() => {
    const unsub = subscribeToSimulatorSessions(setSessions)
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Pulso cada segundo para animar el "hace X seg"
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const running   = sessions.filter(s => s.status === 'running').length
  const idle      = sessions.filter(s => s.status === 'idle').length
  const completed = sessions.filter(s => s.status === 'completed').length
  const avgTps    = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.tps, 0) / sessions.length)
    : 0

  function sinceNow(ts: number | null): string {
    if (!ts) return '—'
    const secs = Math.floor((Date.now() - ts) / 1000)
    if (secs < 60)  return `hace ${secs}s`
    if (secs < 3600) return `hace ${Math.floor(secs / 60)}m`
    return `hace ${Math.floor(secs / 3600)}h`
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="bg-surface-800 border-b border-surface-600 px-6 py-3.5 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Shield size={15} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Panel de Administrador</h1>
          <p className="text-[11px] text-slate-500">Monitoreo en tiempo real — Simulador de Carga</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          En vivo
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 flex flex-col gap-6">

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Users size={16} className="text-violet-400" />}
            label="Total conectados"
            value={sessions.length}
          />
          <StatCard
            icon={<Activity size={16} className="text-emerald-400" />}
            label="Simulando ahora"
            value={running}
            sub={`${idle} inactivos · ${completed} finalizados`}
          />
          <StatCard
            icon={<Zap size={16} className="text-amber-400" />}
            label="TPS promedio"
            value={avgTps}
            sub="trans/seg en curso"
          />
          <StatCard
            icon={<Database size={16} className="text-sky-400" />}
            label="Motores activos"
            value={new Set(sessions.filter(s => s.status === 'running').map(s => s.engine)).size}
            sub="en ejecución"
          />
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-surface-600 flex items-center gap-2">
            <Users size={14} className="text-slate-400" />
            <span className="text-sm font-semibold text-white">Usuarios conectados</span>
            <span className="ml-auto text-xs text-slate-500 tabular-nums">{sessions.length} sesiones</span>
          </div>

          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <Users size={32} className="opacity-30" />
              <p className="text-sm">Sin usuarios conectados aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-600 text-left">
                    <th className="px-4 py-2.5 text-xs text-slate-500 font-medium">Estado</th>
                    <th className="px-4 py-2.5 text-xs text-slate-500 font-medium">Usuario</th>
                    <th className="px-4 py-2.5 text-xs text-slate-500 font-medium">Motor</th>
                    <th className="px-4 py-2.5 text-xs text-slate-500 font-medium">Operaciones</th>
                    <th className="px-4 py-2.5 text-xs text-slate-500 font-medium text-right">Usuarios</th>
                    <th className="px-4 py-2.5 text-xs text-slate-500 font-medium text-right">TPS</th>
                    <th className="px-4 py-2.5 text-xs text-slate-500 font-medium text-right">CPU</th>
                    <th className="px-4 py-2.5 text-xs text-slate-500 font-medium text-right">Latencia</th>
                    <th className="px-4 py-2.5 text-xs text-slate-500 font-medium text-right">Conectado</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => {
                    const activeQTs = Object.entries(s.queryTypes)
                      .filter(([, v]) => v)
                      .map(([k]) => k)

                    return (
                      <tr
                        key={s.id}
                        className="border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors"
                      >
                        {/* Estado */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusDot status={s.status} />
                            <span className={`text-xs ${
                              s.status === 'running'   ? 'text-emerald-400' :
                              s.status === 'completed' ? 'text-sky-400' :
                              'text-slate-500'
                            }`}>
                              {s.status === 'running' ? 'Corriendo' : s.status === 'completed' ? 'Finalizado' : 'Inactivo'}
                            </span>
                          </div>
                        </td>

                        {/* Usuario */}
                        <td className="px-4 py-3">
                          <span className="font-medium text-white">{s.name}</span>
                        </td>

                        {/* Motor */}
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${ENGINE_COLORS[s.engine] ?? 'bg-surface-700 text-slate-300 border-surface-500'}`}>
                            {ENGINE_LABELS[s.engine] ?? s.engine}
                          </span>
                        </td>

                        {/* Operaciones */}
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {activeQTs.length === 0 ? (
                              <span className="text-xs text-slate-600">—</span>
                            ) : activeQTs.map(qt => (
                              <span
                                key={qt}
                                className={`text-[11px] px-1.5 py-0.5 rounded border font-semibold ${QT_COLORS[qt] ?? ''}`}
                              >
                                {qt}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Usuarios virtuales */}
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                          {s.status === 'running' ? (
                            <span>
                              <span className="font-semibold text-white">{s.currentUsers}</span>
                              <span className="text-slate-500">/{s.maxUsers}</span>
                            </span>
                          ) : '—'}
                        </td>

                        {/* TPS */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={`font-semibold ${s.tps > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {s.status === 'running' ? s.tps : '—'}
                          </span>
                        </td>

                        {/* CPU */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          {s.status === 'running' ? (
                            <span className={`font-semibold ${
                              s.cpuUsage >= 90 ? 'text-red-400' :
                              s.cpuUsage >= 70 ? 'text-amber-400' :
                              'text-slate-300'
                            }`}>
                              {s.cpuUsage.toFixed(0)}%
                            </span>
                          ) : '—'}
                        </td>

                        {/* Latencia */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          {s.status === 'running' ? (
                            <span className={`font-semibold ${s.latency > 200 ? 'text-red-400' : 'text-slate-300'}`}>
                              {s.latency.toFixed(0)}ms
                            </span>
                          ) : '—'}
                        </td>

                        {/* Conectado hace */}
                        <td className="px-4 py-3 text-right text-xs text-slate-500 tabular-nums">
                          {sinceNow(s.connectedAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
