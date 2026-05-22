import { useState, useEffect } from 'react'
import { X, WifiOff, Shield, User, Activity } from 'lucide-react'
import { isConfigured } from '../lib/firebase'
import { subscribeToPresence, type OnlineUser } from '../lib/presence'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ENGINE_META: Record<string, { label: string; color: string; icon: string }> = {
  mysql:      { label: 'MySQL',      color: '#4479a1', icon: '🐬' },
  postgresql: { label: 'PostgreSQL', color: '#336791', icon: '🐘' },
  sqlserver:  { label: 'SQL Server', color: '#e74c3c', icon: '🔴' },
  sqlite:     { label: 'SQLite',     color: '#0085CA', icon: '💎' },
  oracle:     { label: 'Oracle',     color: '#f97316', icon: '🔶' },
  mongodb:    { label: 'MongoDB',    color: '#47a248', icon: '🍃' },
  redis:      { label: 'Redis',      color: '#dc382d', icon: '⚡' },
}

function timeAgo(ts: number | null): string {
  if (!ts) return 'ahora'
  const secs = Math.floor((Date.now() - ts) / 1000)
  if (secs < 60)   return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  return `${Math.floor(secs / 3600)}h`
}

// ─── Not configured ───────────────────────────────────────────────────────────

function NotConfigured({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
      style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(71,85,105,0.4)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'rgba(71,85,105,0.3)' }}>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-slate-500" />
          <span className="text-sm font-bold text-white">Monitor de Sesiones</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-white transition-colors"
          style={{ background: 'rgba(71,85,105,0.2)' }}>
          <X size={12} />
        </button>
      </div>
      <div className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <WifiOff size={20} className="text-amber-400" />
        </div>
        <p className="text-sm font-semibold text-white mb-1">Firebase no configurado</p>
        <p className="text-xs text-slate-500 leading-relaxed">Conecta Firebase Realtime Database para ver usuarios en tiempo real.</p>
      </div>
    </div>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  session?: { username: string; role: string; color: string }
}

export default function OnlineUsersPanel({ onClose, session }: Props) {
  if (!isConfigured) return <NotConfigured onClose={onClose} />
  return <RealPanel onClose={onClose} session={session} />
}

function RealPanel({ onClose, session }: Props) {
  const [users, setUsers] = useState<OnlineUser[]>([])
  const [peak,  setPeak]  = useState(0)
  const [tick,  setTick]  = useState(0)

  useEffect(() => {
    const unsub = subscribeToPresence(list => {
      setUsers(list)
      setPeak(p => Math.max(p, list.length))
    })
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Reloj para actualizar timeAgo cada 10s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 10_000)
    return () => clearInterval(t)
  }, [])

  void tick

  const count    = users.length
  const admins   = users.filter(u => u.role === 'Administrador').length
  const regular  = users.filter(u => u.role !== 'Administrador').length

  // Engines en uso (únicos)
  const enginesInUse = [...new Set(users.map(u => u.engine))]

  return (
    <div className="absolute right-0 top-full mt-2 w-[340px] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
      style={{
        maxHeight: '88vh',
        background: 'rgba(10,15,30,0.97)',
        border: '1px solid rgba(99,102,241,0.2)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1)',
      }}>

      {/* ── Barra superior de color ─────────────────────────────────────────── */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#10b981,#3b82f6)' }} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(71,85,105,0.25)' }}>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10b981' }} />
            <span className="relative flex w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Monitor de Sesiones</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(148,163,184,0.6)' }}>Firebase Realtime · en vivo</p>
          </div>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-500 hover:text-white transition-all"
          style={{ background: 'rgba(71,85,105,0.15)', border: '1px solid rgba(71,85,105,0.2)' }}>
          <X size={13} />
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 shrink-0" style={{ borderBottom: '1px solid rgba(71,85,105,0.25)' }}>
        {[
          { label: 'Activos', value: count, color: '#10b981' },
          { label: 'Pico máx.', value: peak, color: '#f59e0b' },
          { label: 'Motores', value: enginesInUse.length, color: '#6366f1' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center py-3" style={{ borderRight: i < 2 ? '1px solid rgba(71,85,105,0.25)' : 'none' }}>
            <span className="text-xl font-black" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(148,163,184,0.5)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Roles breakdown ─────────────────────────────────────────────────── */}
      {count > 0 && (
        <div className="px-4 py-2.5 flex items-center gap-3 shrink-0" style={{ borderBottom: '1px solid rgba(71,85,105,0.25)' }}>
          <div className="flex items-center gap-1.5">
            <Shield size={11} className="text-blue-400" />
            <span className="text-[11px] font-semibold text-blue-400">{admins}</span>
            <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.5)' }}>admin{admins !== 1 ? 's' : ''}</span>
          </div>
          <div className="w-px h-3" style={{ background: 'rgba(71,85,105,0.4)' }} />
          <div className="flex items-center gap-1.5">
            <User size={11} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-300">{regular}</span>
            <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.5)' }}>usuario{regular !== 1 ? 's' : ''}</span>
          </div>
          {enginesInUse.length > 0 && (
            <>
              <div className="w-px h-3 ml-auto" style={{ background: 'rgba(71,85,105,0.4)' }} />
              <div className="flex items-center gap-1">
                {enginesInUse.map(e => (
                  <span key={e} title={ENGINE_META[e]?.label ?? e} className="text-sm leading-none">{ENGINE_META[e]?.icon ?? '⚙️'}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Lista de usuarios ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-2">
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(71,85,105,0.15)', border: '1px solid rgba(71,85,105,0.2)' }}>
              <WifiOff size={18} style={{ color: 'rgba(148,163,184,0.4)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(226,232,240,0.6)' }}>Nadie conectado aún</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(148,163,184,0.35)' }}>Las sesiones activas aparecerán aquí</p>
          </div>
        ) : (
          users.map(u => {
            const isMe   = u.name === session?.username
            const isAdmin = u.role === 'Administrador'
            const eng    = ENGINE_META[u.engine]
            return (
              <div key={u.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: isMe
                    ? 'rgba(99,102,241,0.12)'
                    : 'rgba(30,41,59,0.5)',
                  border: isMe
                    ? '1px solid rgba(99,102,241,0.3)'
                    : '1px solid rgba(71,85,105,0.2)',
                }}>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-black text-white"
                    style={{ background: u.color, boxShadow: `0 0 12px ${u.color}40` }}>
                    {u.name[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: '#10b981', borderColor: 'rgba(10,15,30,1)' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-white truncate">{u.name}</span>
                    {isMe && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-black shrink-0"
                        style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                        TÚ
                      </span>
                    )}
                    {isAdmin && (
                      <Shield size={9} className="text-blue-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold" style={{ color: eng?.color ?? '#94a3b8' }}>
                      {eng?.icon} {eng?.label ?? u.engine}
                    </span>
                    <span style={{ color: 'rgba(71,85,105,0.8)' }}>·</span>
                    <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.5)' }}>{u.role}</span>
                  </div>
                </div>

                {/* Tiempo */}
                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-medium tabular-nums" style={{ color: 'rgba(148,163,184,0.4)' }}>
                    {timeAgo(u.connectedAt)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 shrink-0 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(71,85,105,0.25)', background: 'rgba(15,23,42,0.5)' }}>
        <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.35)' }}>
          Actualización en tiempo real
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
          <span className="text-[9px] font-semibold" style={{ color: '#10b981' }}>LIVE</span>
        </div>
      </div>
    </div>
  )
}
