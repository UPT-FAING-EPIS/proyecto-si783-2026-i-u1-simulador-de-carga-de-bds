import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import {
  X, Play, Square, Zap, AlertTriangle, Activity,
  Users, Clock, TrendingUp, Database, Download,
  Pause, History, GitCompare, Gauge, Trash2,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { ENGINE_CONFIGS } from '../types'
import type { EngineType } from '../types'
import { loadHistory, saveHistoryEntry, clearHistory, deleteHistoryEntry } from '../utils/loadHistory'
import type { LoadHistoryEntry } from '../utils/loadHistory'

// ─── SVG Live Chart ───────────────────────────────────────────────────────────

interface LiveChartProps {
  data: number[]
  color: string
  label: string
  unit: string
  warningLevel?: number
  criticalLevel?: number
  chartId: string
}

function LiveChart({ data, color, label, unit, warningLevel, criticalLevel, chartId }: LiveChartProps) {
  const W = 400
  const H = 72
  const padY = 4
  const inner = H - padY * 2

  const [hoverT, setHoverT] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const max = Math.max(...data, 1)
  const lastVal = data[data.length - 1] ?? 0
  const isCritical = criticalLevel !== undefined && lastVal >= criticalLevel
  const isWarning = warningLevel !== undefined && lastVal >= warningLevel
  const lineColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : color

  const pts = data.map((v, i) => {
    const x = data.length < 2 ? 0 : (i / (data.length - 1)) * W
    const y = padY + inner - (v / max) * inner
    return [x, y] as [number, number]
  })

  const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const polygon  = pts.length > 1
    ? `0,${H} ${polyline} ${W},${H}`
    : ''

  const gradId = `g-${chartId}`

  const hoverIdx = hoverT !== null && data.length > 1
    ? Math.round(hoverT * (data.length - 1))
    : null
  const hoverVal = hoverIdx !== null ? data[hoverIdx] : null
  const hoverAgo = hoverIdx !== null ? (data.length - 1 - hoverIdx) * 0.5 : null

  function handleMove(e: ReactMouseEvent<HTMLDivElement>) {
    if (!wrapRef.current || data.length < 2) return
    const rect = wrapRef.current.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setHoverT(t)
  }

  const labelLeftPct = hoverT !== null ? Math.min(92, Math.max(8, hoverT * 100)) : 0

  return (
    <div className="bg-surface-800 rounded-xl p-3 border border-surface-600 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${
          isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-white'
        }`}>
          {lastVal.toFixed(0)}{unit}
          {isCritical && <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 bg-red-900/40 text-red-400 border border-red-800/50 rounded">CRÍTICO</span>}
        </span>
      </div>

      <div
        ref={wrapRef}
        className="relative cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverT(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={lineColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f}
              x1={0} x2={W}
              y1={padY + inner * (1 - f)} y2={padY + inner * (1 - f)}
              stroke="#1e293b" strokeWidth={1}
            />
          ))}

          {/* Warning threshold line */}
          {warningLevel !== undefined && max > 0 && (
            <line
              x1={0} x2={W}
              y1={padY + inner - (warningLevel / max) * inner}
              y2={padY + inner - (warningLevel / max) * inner}
              stroke="#f59e0b" strokeWidth={0.8} strokeDasharray="6,4" opacity={0.5}
            />
          )}

          {/* Fill */}
          {polygon && (
            <polygon points={polygon} fill={`url(#${gradId})`} />
          )}

          {/* Line */}
          {pts.length > 1 && (
            <polyline
              points={polyline}
              fill="none"
              stroke={lineColor}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover marker */}
          {hoverIdx !== null && pts[hoverIdx] && (
            <circle cx={pts[hoverIdx][0]} cy={pts[hoverIdx][1]} r={3} fill={lineColor} stroke="#0f172a" strokeWidth={1.2} />
          )}
        </svg>

        {/* Hover guide line + tooltip (overlay HTML, no se distorsiona con el viewBox) */}
        {hoverIdx !== null && hoverVal !== null && (
          <>
            <div
              className="absolute top-0 bottom-0 w-px bg-white/20 pointer-events-none"
              style={{ left: `${hoverT! * 100}%` }}
            />
            <div
              className="absolute -top-1 -translate-x-1/2 px-2 py-1 rounded-md bg-surface-900 border border-surface-600 shadow-lg text-[10px] whitespace-nowrap pointer-events-none z-10"
              style={{ left: `${labelLeftPct}%` }}
            >
              <span className="font-bold text-white">{hoverVal.toFixed(0)}{unit}</span>
              <span className="text-slate-500 ml-1.5">hace {hoverAgo?.toFixed(1)}s</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Progress Bar Indicator ───────────────────────────────────────────────────

function MetricBar({
  label, value, max, unit = '', decimals = 0,
  warningAt = 70, criticalAt = 90,
}: {
  label: string; value: number; max: number; unit?: string
  decimals?: number; warningAt?: number; criticalAt?: number
}) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  const isCritical = pct >= criticalAt
  const isWarning  = pct >= warningAt

  const barColor  = isCritical ? 'bg-red-500'    : isWarning ? 'bg-amber-500'    : 'bg-emerald-500'
  const textColor = isCritical ? 'text-red-400'   : isWarning ? 'text-amber-400'  : 'text-emerald-400'

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[11px] text-slate-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[11px] font-semibold tabular-nums w-20 text-right shrink-0 ${textColor}`}>
        {value.toFixed(decimals)}{unit} / {max}{unit}
      </span>
      {isCritical && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-900/30 text-red-400 border border-red-800/40 rounded shrink-0">
          SATURADO
        </span>
      )}
    </div>
  )
}

// ─── Stat Badge ───────────────────────────────────────────────────────────────

function StatBadge({ label, value, color = 'text-white' }: {
  label: string; value: string | number; color?: string
}) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoadMetrics {
  currentUsers: number
  tps: number
  peakTps: number
  latency: number
  cpuUsage: number
  connections: number
  errorCount: number
  elapsedSeconds: number
  totalErrors: number
}

// ─── Engine Result Panel (charts + indicadores de un motor — usado en modo comparación) ─

function EngineResultPanel({
  title, emoji, accent, metrics, latencyData, tpsData, cpuData, connData, connectionLimit, maxUsersLabel, verdict,
}: {
  title: string; emoji: string; accent: string
  metrics: LoadMetrics
  latencyData: number[]; tpsData: number[]; cpuData: number[]; connData: number[]
  connectionLimit: number; maxUsersLabel: number | string
  verdict?: Verdict | null
}) {
  return (
    <div className="flex flex-col gap-2.5 min-w-0">
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-bold text-white truncate">{title}</span>
        {verdict && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${VERDICT_STYLES[verdict.accent]}`}>
            {verdict.icon} {verdict.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <LiveChart data={latencyData} color={accent} label="Latencia (ms)"
          unit="ms" warningLevel={200} criticalLevel={400} chartId={`lat-${title}`} />
        <LiveChart data={tpsData}     color="#10b981" label="TPS (consultas/seg)"
          unit="" chartId={`tps-${title}`} />
        <LiveChart data={cpuData}     color="#f59e0b" label="Uso de CPU BD (%)"
          unit="%" warningLevel={70} criticalLevel={90} chartId={`cpu-${title}`} />
        <LiveChart data={connData}    color="#8b5cf6" label="Conexiones activas"
          unit="" chartId={`conn-${title}`} />
      </div>

      <div className="bg-surface-800 rounded-xl border border-surface-600 overflow-hidden">
        <div className="p-3 space-y-2">
          <MetricBar label="CPU BD" value={metrics.cpuUsage} max={100} unit="%" decimals={1} warningAt={70} criticalAt={90} />
          <MetricBar label="Conexiones" value={metrics.connections} max={connectionLimit} warningAt={80} criticalAt={95} />
        </div>
        <div className="px-3 py-2.5 border-t border-surface-600 grid grid-cols-3 gap-2 divide-x divide-surface-700">
          <StatBadge label="TPS"       value={metrics.tps}                       color="text-emerald-400" />
          <StatBadge label="Pico TPS"  value={metrics.peakTps}                   color="text-blue-400" />
          <StatBadge label="Latencia"  value={`${metrics.latency.toFixed(0)}ms`} color="text-white" />
        </div>
        <div className="px-3 py-2 border-t border-surface-600 flex items-center justify-between text-[10px] text-slate-500">
          <span>Usuarios: <span className="text-slate-300 font-semibold">{metrics.currentUsers}/{maxUsersLabel}</span></span>
          <span>Errores: <span className={metrics.totalErrors > 0 ? 'text-red-400 font-semibold' : 'text-slate-300 font-semibold'}>{metrics.totalErrors}</span></span>
        </div>
      </div>
    </div>
  )
}

type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'

interface LoadScriptLog {
  id: string
  createdAt: number
  timestamp: string
  type: QueryType
  script: string
  status: 'OK' | 'ERROR'
  users: number
  tps: number
  latency: number
  message: string
  /** Etiqueta del motor que generó el log — solo relevante en modo comparación */
  engineLabel?: string
}

const LOG_LIMIT = 10

type LoadStatus = 'idle' | 'running' | 'paused' | 'completed'

const EMPTY_METRICS: LoadMetrics = {
  currentUsers: 0, tps: 0, peakTps: 0, latency: 0,
  cpuUsage: 0, connections: 0, errorCount: 0,
  elapsedSeconds: 0, totalErrors: 0,
}

// ─── Pure tick computation (reused para motor único, comparación y ataque progresivo) ─

interface TickParams {
  currentUsers: number
  perfFactor: number
  connLimit: number
  netLatency: number
  errEnabled: boolean
  errProb: number
}

interface TickOutput {
  tps: number
  cpuUsage: number
  connections: number
  latency: number
  errorCount: number
}

function computeEngineTick(p: TickParams): TickOutput {
  const baseQPS = p.currentUsers * (1 + Math.random() * 2) * p.perfFactor
  const tps = Math.max(0, Math.round(baseQPS + (Math.random() - 0.45) * 20))

  const effectiveLimit = Math.max(p.connLimit * p.perfFactor, 1)
  const connRatio = Math.min(p.currentUsers / effectiveLimit, 1)
  const cpuBase = connRatio * 78 + (tps / (600 * p.perfFactor)) * 12
  const cpuUsage = Math.min(100, Math.max(0, cpuBase + (Math.random() - 0.35) * 8))

  const connections = Math.min(p.currentUsers, p.connLimit)

  const saturation = Math.max(0, (cpuUsage - 60) / 40)
  const latency = p.netLatency + 15 + saturation * 420 + Math.random() * 25

  const errFactor = p.errEnabled ? p.errProb : Math.max(0, (cpuUsage - 82) / 18) * 0.15
  const errorCount = Math.floor(errFactor * p.currentUsers * Math.random() * 2.5)

  return { tps, cpuUsage, connections, latency, errorCount }
}

// ─── Veredicto automático al completar una prueba ───────────────────────────────

interface Verdict { label: string; icon: string; accent: 'emerald' | 'amber' | 'red' }

function computeVerdict(totalErrors: number, avgLatency: number): Verdict {
  if (totalErrors === 0 && avgLatency < 150) return { label: 'Apto para producción', icon: '✅', accent: 'emerald' }
  if (totalErrors < 10 && avgLatency < 350) return { label: 'Necesita optimización', icon: '⚠️', accent: 'amber' }
  return { label: 'No soporta esta carga', icon: '🔴', accent: 'red' }
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

const VERDICT_STYLES: Record<Verdict['accent'], string> = {
  emerald: 'bg-emerald-900/20 text-emerald-300 border-emerald-800/40',
  amber:   'bg-amber-900/20 text-amber-300 border-amber-800/40',
  red:     'bg-red-900/20 text-red-300 border-red-800/40',
}

// ─── Ataque progresivo: parámetros de la rampa automática ──────────────────────
const PROG_USERS_START   = 10
const PROG_STEP_USERS    = 20
const PROG_STEP_SECONDS  = 8
const PROG_USERS_CAP     = 2000
const PROG_SATURATION_STREAK = 3

// ─── Modal ────────────────────────────────────────────────────────────────────

export interface ModalActivityUpdate {
  engine:       string
  queryTypes:   { SELECT: boolean; INSERT: boolean; UPDATE: boolean; DELETE: boolean }
  status:       'idle' | 'running' | 'completed'
  tps:          number
  currentUsers: number
  maxUsers:     number
  cpuUsage:     number
  latency:      number
}

export default function LoadSimulatorModal({
  onClose,
  standalone = false,
  onActivityChange,
  userName,
  onBack,
}: {
  onClose: () => void
  standalone?: boolean
  onActivityChange?: (data: ModalActivityUpdate) => void
  userName?: string
  onBack?: () => void
}) {
  const store = useStore()

  // ── Config ──────────────────────────────────────────────────────────────────
  const [engine,     setEngine]     = useState<EngineType>('mysql')
  const [duration,   setDuration]   = useState(300)
  const [maxUsers,   setMaxUsers]   = useState(200)
  const [rampUp,     setRampUp]     = useState(30)
  const [queryTypes, setQueryTypes] = useState({
    SELECT: true, INSERT: true, UPDATE: false, DELETE: false,
  })

  // ── Modos especiales ─────────────────────────────────────────────────────────
  const [compareMode,     setCompareMode]     = useState(false)
  const [engineB,         setEngineB]         = useState<EngineType>('postgresql')
  const [progressiveMode, setProgressiveMode] = useState(false)
  const [showHistory,     setShowHistory]     = useState(false)
  const [historyEntries,  setHistoryEntries]  = useState<LoadHistoryEntry[]>([])
  const [breakingPoint,   setBreakingPoint]   = useState<number | null>(null)

  // ── Runtime state ───────────────────────────────────────────────────────────
  const [status,      setStatus]      = useState<LoadStatus>('idle')
  const [metrics,     setMetrics]     = useState<LoadMetrics>(EMPTY_METRICS)
  const [latencyData, setLatencyData] = useState<number[]>([])
  const [tpsData,     setTpsData]     = useState<number[]>([])
  const [cpuData,     setCpuData]     = useState<number[]>([])
  const [connData,    setConnData]    = useState<number[]>([])

  // ── Runtime state — Motor B (modo comparación) ─────────────────────────────
  const [metricsB,     setMetricsB]     = useState<LoadMetrics>(EMPTY_METRICS)
  const [latencyDataB, setLatencyDataB] = useState<number[]>([])
  const [tpsDataB,     setTpsDataB]     = useState<number[]>([])
  const [cpuDataB,     setCpuDataB]     = useState<number[]>([])
  const [connDataB,    setConnDataB]    = useState<number[]>([])

  const [scriptLogs,  setScriptLogs]  = useState<LoadScriptLog[]>([])
  const [logFilter,   setLogFilter]   = useState<'ALL' | QueryType>('ALL')
  const [logSearch,   setLogSearch]   = useState('')
  const [logSort,     setLogSort]     = useState<'TIME_DESC' | 'TIME_ASC' | 'SEVERITY'>('TIME_DESC')
  const [mobileConfigOpen, setMobileConfigOpen] = useState(false)
  const engineCfg  = ENGINE_CONFIGS[engine]
  const engineCfgB = ENGINE_CONFIGS[engineB]

  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef    = useRef(0)
  const peakRef         = useRef(0)
  const peakRefB        = useRef(0)
  const totalErrRef     = useRef(0)
  const totalErrRefB    = useRef(0)
  const latencySumRef   = useRef(0)
  const latencySumRefB  = useRef(0)
  const sampleCountRef  = useRef(0)
  const lastCpuRef      = useRef(0)
  const lastLatencyRef  = useRef(0)
  const logViewportRef  = useRef<HTMLDivElement | null>(null)

  // Pausa: tiempo acumulado pausado, para no contarlo en "elapsed"
  const pausedDurationRef = useRef(0)
  const pauseStartRef     = useRef(0)

  // Ataque progresivo: usuarios actuales del ramp automático y racha de saturación
  const progUsersRef     = useRef(10)
  const progStepAtRef    = useRef(0)
  const satStreakRef     = useRef(0)
  const breakingPointRef = useRef<number | null>(null)

  useEffect(() => {
    setHistoryEntries(loadHistory())
  }, [])

  const activeQueryTypes = (Object.entries(queryTypes) as Array<[QueryType, boolean]>)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type)

  function pickQueryType(seed: number): QueryType {
    const enabled: QueryType[] = activeQueryTypes.length > 0 ? activeQueryTypes : ['SELECT']
    return enabled[seed % enabled.length]
  }

  function buildScript(type: QueryType, tick: number, userCount: number, engineKey: EngineType = engine) {
    const rowIdx    = (userCount % 500) + 1
    const productId = (tick % 7) + 1

    // MongoDB
    if (engineKey === 'mongodb') {
      switch (type) {
        case 'SELECT': return `db.orders.find({ user_id: ${rowIdx} }).sort({ created_at: -1 }).limit(25)`
        case 'INSERT': return `db.audit_log.insertOne({ user_id: ${rowIdx}, action: "login", created_at: new Date() })`
        case 'UPDATE': return `db.inventory.updateOne({ product_id: ${productId} }, { $inc: { stock: -1 } })`
        case 'DELETE': return `db.sessions.deleteMany({ last_seen: { $lt: new Date(Date.now() - 30*86400000) } })`
      }
    }

    // Redis
    if (engineKey === 'redis') {
      switch (type) {
        case 'SELECT': return `GET session:${rowIdx}`
        case 'INSERT': return `SETEX session:${rowIdx} 86400 "active"`
        case 'UPDATE': return `HINCRBY inventory:${productId} stock -1`
        case 'DELETE': return `DEL session:${rowIdx}`
      }
    }

    // SQL engines — cada uno con su dialecto correcto
    switch (engineKey) {
      case 'oracle':
        switch (type) {
          case 'SELECT': return `SELECT * FROM orders WHERE user_id = ${rowIdx} ORDER BY created_at DESC FETCH FIRST 25 ROWS ONLY;`
          case 'INSERT': return `INSERT INTO audit_log (user_id, action, created_at) VALUES (${rowIdx}, 'login', SYSDATE);`
          case 'UPDATE': return `UPDATE inventory SET stock = stock - 1 WHERE product_id = ${productId};`
          case 'DELETE': return `DELETE FROM sessions WHERE last_seen < SYSDATE - 30;`
        }

      case 'sqlserver':
        switch (type) {
          case 'SELECT': return `SELECT TOP 25 * FROM orders WHERE user_id = ${rowIdx} ORDER BY created_at DESC;`
          case 'INSERT': return `INSERT INTO audit_log (user_id, action, created_at) VALUES (${rowIdx}, 'login', GETDATE());`
          case 'UPDATE': return `UPDATE inventory SET stock = stock - 1 WHERE product_id = ${productId};`
          case 'DELETE': return `DELETE FROM sessions WHERE last_seen < DATEADD(day, -30, GETDATE());`
        }

      case 'postgresql':
        switch (type) {
          case 'SELECT': return `SELECT * FROM orders WHERE user_id = ${rowIdx} ORDER BY created_at DESC LIMIT 25;`
          case 'INSERT': return `INSERT INTO audit_log (user_id, action, created_at) VALUES (${rowIdx}, 'login', NOW()) ON CONFLICT DO NOTHING;`
          case 'UPDATE': return `UPDATE inventory SET stock = stock - 1 WHERE product_id = ${productId};`
          case 'DELETE': return `DELETE FROM sessions WHERE last_seen < NOW() - INTERVAL '30 days';`
        }

      case 'sqlite':
        switch (type) {
          case 'SELECT': return `SELECT * FROM orders WHERE user_id = ${rowIdx} ORDER BY created_at DESC LIMIT 25;`
          case 'INSERT': return `INSERT INTO audit_log (user_id, action, created_at) VALUES (${rowIdx}, 'login', datetime('now'));`
          case 'UPDATE': return `UPDATE inventory SET stock = stock - 1 WHERE product_id = ${productId};`
          case 'DELETE': return `DELETE FROM sessions WHERE last_seen < datetime('now', '-30 days');`
        }

      default: // mysql
        switch (type) {
          case 'SELECT': return `SELECT * FROM orders WHERE user_id = ${rowIdx} ORDER BY created_at DESC LIMIT 25;`
          case 'INSERT': return `INSERT INTO audit_log (user_id, action, created_at) VALUES (${rowIdx}, 'login', NOW());`
          case 'UPDATE': return `UPDATE inventory SET stock = stock - 1 WHERE product_id = ${productId};`
          case 'DELETE': return `DELETE FROM sessions WHERE last_seen < NOW() - INTERVAL 30 DAY;`
        }
    }

    return ''
  }

  function createLogEntry(
    type: QueryType, tick: number, currentUsers: number, tps: number, latency: number, errored: boolean,
    engineKey: EngineType = engine, engineLabel?: string,
  ): LoadScriptLog {
    const createdAt = Date.now()
    return {
      id: `${createdAt}-${tick}-${type}-${engineKey}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt,
      timestamp: new Date().toLocaleTimeString(),
      type,
      script: buildScript(type, tick, currentUsers, engineKey),
      status: errored ? 'ERROR' : 'OK',
      users: currentUsers,
      tps,
      latency,
      message: errored ? 'Timeout simulado por saturación' : 'Ejecución simulada exitosa',
      engineLabel,
    }
  }

  function downloadFile(fileName: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  function escapeCsv(value: string | number | undefined | null) {
    const text = String(value ?? '')
    return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const filteredLogs = logFilter === 'ALL'
    ? scriptLogs
    : scriptLogs.filter(log => log.type === logFilter)

  const searchedLogs = useMemo(() => {
    const term = logSearch.trim().toLowerCase()
    if (!term) return filteredLogs

    return filteredLogs.filter(log => {
      return [
        log.timestamp,
        log.type,
        log.status,
        log.message,
        log.script,
        `${log.users}`,
        `${log.tps}`,
        `${log.latency}`,
      ].some(field => field.toLowerCase().includes(term))
    })
  }, [filteredLogs, logSearch])

  const sortedLogs = useMemo(() => {
    const severityWeight = (status: LoadScriptLog['status']) => (status === 'ERROR' ? 1 : 0)

    return [...searchedLogs].sort((left, right) => {
      if (logSort === 'SEVERITY') {
        const severityDiff = severityWeight(right.status) - severityWeight(left.status)
        if (severityDiff !== 0) return severityDiff
        return right.createdAt - left.createdAt
      }

      return logSort === 'TIME_ASC'
        ? left.createdAt - right.createdAt
        : right.createdAt - left.createdAt
    })
  }, [searchedLogs, logSort])

  const visibleLogs = sortedLogs.slice(0, LOG_LIMIT)

  useEffect(() => {
    if (logViewportRef.current) {
      logViewportRef.current.scrollTop = 0
    }
  }, [visibleLogs.length, logFilter, logSearch, status])

  function exportLogsAsJson() {
    if (visibleLogs.length === 0) return
    const payload = JSON.stringify(visibleLogs, null, 2)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadFile(`sim-carga-logs-${stamp}.json`, payload, 'application/json;charset=utf-8')
  }

  function exportLogsAsCsv() {
    if (visibleLogs.length === 0) return
    const rows = [
      ['timestamp', 'type', 'status', 'users', 'tps', 'latency', 'message', 'script'],
      ...visibleLogs.map(log => [
        log.timestamp,
        log.type,
        log.status,
        log.users,
        log.tps,
        `${log.latency.toFixed(0)}ms`,
        log.message,
        log.script,
      ]),
    ]
    const csv = rows
      .map(row => row.map(value => escapeCsv(value)).join(','))
      .join('\n')
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadFile(`sim-carga-logs-${stamp}.csv`, csv, 'text/csv;charset=utf-8')
  }

  // ── HTML Report ─────────────────────────────────────────────────────────────
  function generateHtmlReport() {
    const stamp      = new Date().toLocaleString('es-PE')
    const reportDate = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const activeQTs  = (Object.entries(queryTypes) as [string, boolean][]).filter(([, v]) => v).map(([k]) => k).join(', ')

    function sparkline(data: number[], color: string): string {
      if (data.length < 2) return `<div style="height:60px;background:#f1f5f9;border-radius:6px"></div>`
      const W = 480, H = 60
      const max = Math.max(...data, 1)
      const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * H}`).join(' ')
      const fill = `0,${H} ${pts} ${W},${H}`
      const gid  = `g${color.replace('#', '')}`
      return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient></defs>
        <polygon points="${fill}" fill="url(#${gid})"/>
        <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    }

    const avgLatency  = latencyData.length > 0  ? (latencyData.reduce((a, b) => a + b, 0) / latencyData.length)  : metrics.latency
    const avgLatencyB = latencyDataB.length > 0 ? (latencyDataB.reduce((a, b) => a + b, 0) / latencyDataB.length) : metricsB.latency

    const analysis: string[] = []
    if (metrics.peakTps >= 400)      analysis.push('<li><strong style="color:#16a34a">✅ Alto rendimiento:</strong> El sistema alcanzó un pico de TPS elevado, demostrando buena capacidad bajo carga.</li>')
    else if (metrics.peakTps >= 150) analysis.push('<li><strong style="color:#d97706">⚠️ Rendimiento moderado:</strong> El TPS fue aceptable. Considera optimizar índices o aumentar el pool de conexiones.</li>')
    else                             analysis.push('<li><strong style="color:#dc2626">🔴 Rendimiento bajo:</strong> El pico de TPS fue reducido. Revisar configuración del servidor y consultas lentas.</li>')

    if (avgLatency < 100)      analysis.push('<li><strong style="color:#16a34a">✅ Latencia excelente:</strong> El tiempo de respuesta promedio se mantuvo por debajo de 100ms.</li>')
    else if (avgLatency < 300) analysis.push(`<li><strong style="color:#d97706">⚠️ Latencia aceptable:</strong> Promedio de ${avgLatency.toFixed(0)}ms. Monitorear en escenarios de mayor carga.</li>`)
    else                       analysis.push(`<li><strong style="color:#dc2626">🔴 Latencia alta:</strong> Promedio de ${avgLatency.toFixed(0)}ms. Posible cuello de botella en red o servidor.</li>`)

    if (metrics.totalErrors === 0)   analysis.push('<li><strong style="color:#16a34a">✅ Sin errores:</strong> El sistema fue completamente estable durante toda la prueba.</li>')
    else if (metrics.totalErrors < 10) analysis.push(`<li><strong style="color:#d97706">⚠️ Errores menores:</strong> Se registraron ${metrics.totalErrors} errores. Investigar causas antes de subir la carga.</li>`)
    else                             analysis.push(`<li><strong style="color:#dc2626">🔴 Inestabilidad detectada:</strong> ${metrics.totalErrors} errores totales. El sistema muestra saturación bajo esta carga.</li>`)

    if (metrics.connections >= store.simulation.connectionLimit * 0.9)
      analysis.push('<li><strong style="color:#dc2626">🔴 Pool de conexiones saturado:</strong> Las conexiones activas alcanzaron el límite configurado. Aumentar el pool o reducir la carga.</li>')
    else
      analysis.push('<li><strong style="color:#16a34a">✅ Conexiones estables:</strong> El pool de conexiones se mantuvo dentro de los límites configurados.</li>')

    const overallColor = metrics.totalErrors === 0 ? '#16a34a' : metrics.totalErrors < 10 ? '#d97706' : '#dc2626'
    const overallLabel = metrics.totalErrors === 0 ? '✓ Prueba exitosa' : metrics.totalErrors < 10 ? '⚠ Con advertencias' : '✗ Con errores'

    const modeLabel = progressiveMode ? 'Ataque progresivo' : compareMode ? 'Comparación de motores' : 'Prueba estándar'

    // ── Sección de comparación Motor A vs Motor B ────────────────────────────
    const compareSectionHtml = compareMode ? (() => {
      const rows: Array<[string, string | number, string | number, boolean]> = [
        ['Pico TPS',          metrics.peakTps,            metricsB.peakTps,            metrics.peakTps >= metricsB.peakTps],
        ['Latencia promedio', `${avgLatency.toFixed(0)}ms`, `${avgLatencyB.toFixed(0)}ms`, avgLatency <= avgLatencyB],
        ['CPU final',         `${metrics.cpuUsage.toFixed(0)}%`, `${metricsB.cpuUsage.toFixed(0)}%`, metrics.cpuUsage <= metricsB.cpuUsage],
        ['Errores totales',   metrics.totalErrors,        metricsB.totalErrors,        metrics.totalErrors <= metricsB.totalErrors],
      ]
      return `
  <div class="section" style="border-top:none">
    <div class="sec-hd">
      <div class="sec-icon" style="background:#ede9fe;color:#7c3aed">⚖️</div>
      <h2>Comparación: ${engineCfg.emoji} ${engineCfg.name} vs ${engineCfgB.emoji} ${engineCfgB.name}</h2>
    </div>
    <div class="sec-body">
      <table class="kv" style="width:100%">
        <tr>
          <td style="width:34%;color:#64748b;font-weight:700;font-size:10px;text-transform:uppercase">Métrica</td>
          <td style="text-align:center;font-weight:700;color:#2563eb">${engineCfg.emoji} ${engineCfg.name}</td>
          <td style="text-align:center;font-weight:700;color:#db2777">${engineCfgB.emoji} ${engineCfgB.name}</td>
        </tr>
        ${rows.map(([label, a, b, aWins]) => `
        <tr>
          <td style="color:#64748b">${label}</td>
          <td style="text-align:center;font-weight:700;color:${aWins ? '#16a34a' : '#1e293b'}">${a}${aWins ? ' 🏆' : ''}</td>
          <td style="text-align:center;font-weight:700;color:${!aWins ? '#16a34a' : '#1e293b'}">${b}${!aWins ? ' 🏆' : ''}</td>
        </tr>`).join('')}
      </table>
      ${sparkline(tpsDataB, '#ec4899') ? `
      <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <div class="chart-label">TPS — ${engineCfg.name}</div>
          ${sparkline(tpsData, '#2563eb')}
        </div>
        <div>
          <div class="chart-label">TPS — ${engineCfgB.name}</div>
          ${sparkline(tpsDataB, '#db2777')}
        </div>
      </div>` : ''}
    </div>
  </div>`
    })() : ''

    // ── Sección de ataque progresivo ──────────────────────────────────────────
    const progressiveSectionHtml = progressiveMode ? `
  <div class="section" style="border-top:none">
    <div class="sec-hd">
      <div class="sec-icon" style="background:#fee2e2;color:#dc2626">🎯</div>
      <h2>Resultado del Ataque Progresivo</h2>
    </div>
    <div class="sec-body">
      <p style="font-size:13px;color:#334155;line-height:1.7">
        El sistema subió usuarios virtuales automáticamente de a ${PROG_STEP_USERS} cada ${PROG_STEP_SECONDS}s.
        ${breakingPoint !== null
          ? `Se detectó saturación sostenida al alcanzar <strong>${breakingPoint} usuarios concurrentes</strong> — ese es el límite estimado de ${engineCfg.name} con la configuración actual del simulador.`
          : 'No se detectó saturación dentro del tiempo de prueba; el motor soportó el máximo de usuarios alcanzado sin degradarse de forma sostenida.'}
      </p>
    </div>
  </div>` : ''

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reporte de Carga — ${engineCfg.name}${compareMode ? ` vs ${engineCfgB.name}` : ''} — ${stamp}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,sans-serif;background:#f8fafc;color:#0f172a;font-size:13px;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{max-width:980px;margin:0 auto;padding:0 0 40px}

    /* ── Cover ── */
    .cover{background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%);color:#fff;padding:40px 48px 36px;position:relative;overflow:hidden;page-break-after:avoid}
    .cover::before{content:'';position:absolute;top:-80px;right:-80px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,.18),transparent 70%)}
    .cover::after{content:'';position:absolute;bottom:-60px;left:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(16,185,129,.12),transparent 70%)}
    .cover-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;position:relative;z-index:1}
    .cover-brand{display:flex;align-items:center;gap:16px}
    .cover-icon{width:52px;height:52px;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 8px 24px rgba(99,102,241,.4)}
    .cover-title{font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.2}
    .cover-sub{font-size:11px;color:#94a3b8;margin-top:4px;letter-spacing:.04em;text-transform:uppercase}
    .status-badge{padding:7px 18px;border-radius:24px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border:1.5px solid;white-space:nowrap}
    .cover-meta{display:grid;grid-template-columns:repeat(6,1fr);gap:0;position:relative;z-index:1;border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden}
    .meta-cell{padding:14px 16px;border-right:1px solid rgba(255,255,255,.08)}
    .meta-cell:last-child{border-right:none}
    .meta-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:4px}
    .meta-val{font-size:13px;font-weight:600;color:#e2e8f0}

    /* ── KPI Strip ── */
    .kpi-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin:0;border-left:none;border-right:none}
    .kpi{background:#fff;padding:24px 20px 20px;text-align:center;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;position:relative;overflow:hidden}
    .kpi:last-child{border-right:none}
    .kpi-accent{position:absolute;top:0;left:0;right:0;height:3px}
    .kpi-val{font-size:36px;font-weight:800;line-height:1;letter-spacing:-.02em;margin-top:6px}
    .kpi-lbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-top:6px}
    .kpi-sub{font-size:10px;color:#94a3b8;margin-top:3px}

    /* ── Section ── */
    .section{background:#fff;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:0;border-top:none}
    .section:first-of-type,.section-first{border-top:1px solid #e2e8f0}
    .sec-hd{padding:13px 20px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #f1f5f9;background:linear-gradient(90deg,#f8fafc,#fff)}
    .sec-hd h2{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#475569}
    .sec-icon{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
    .sec-body{padding:20px}

    /* ── Charts ── */
    .charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:none}
    .chart-cell{padding:20px;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0}
    .chart-cell:nth-child(2){border-right:none}
    .chart-cell:nth-child(3){border-bottom:none}
    .chart-cell:nth-child(4){border-right:none;border-bottom:none}
    .chart-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:4px}
    .chart-peak-val{font-size:28px;font-weight:800;letter-spacing:-.02em;line-height:1;margin-bottom:12px}

    /* ── Two col ── */
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:none}
    .col-left{border-right:1px solid #e2e8f0}

    /* ── KV table ── */
    .kv{width:100%;border-collapse:collapse}
    .kv tr{border-bottom:1px solid #f8fafc}
    .kv tr:last-child{border-bottom:none}
    .kv tr:hover td{background:#f8fafc}
    .kv td{padding:8px 0;font-size:12px;vertical-align:middle}
    .kv td:first-child{color:#64748b;width:56%}
    .kv td:last-child{font-weight:600;text-align:right;color:#1e293b}

    /* ── Analysis ── */
    .analysis-item{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #f8fafc}
    .analysis-item:last-child{border-bottom:none}
    .analysis-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;margin-top:1px}
    .analysis-text{flex:1;font-size:12px;color:#334155;line-height:1.6}
    .analysis-text strong{display:block;font-size:12px;font-weight:700;margin-bottom:2px}

    /* ── Logs table ── */
    .tbl{width:100%;border-collapse:collapse;font-size:11px}
    .tbl thead tr{background:#f8fafc}
    .tbl th{padding:9px 12px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#64748b;border-bottom:2px solid #e2e8f0;font-weight:700;white-space:nowrap}
    .tbl td{padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:top}
    .tbl tr:last-child td{border-bottom:none}
    .tbl tr:nth-child(even) td{background:#fafafa}
    .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border:1px solid}
    .mono{font-family:'Courier New',monospace;font-size:10px;line-height:1.5;color:#1e293b}

    /* ── Footer ── */
    .report-footer{padding:20px 48px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;background:#f8fafc}
    .footer-left{font-size:10px;color:#94a3b8}
    .footer-right{font-size:10px;color:#94a3b8;text-align:right}

    /* ── Print ── */
    @media print{
      body{background:#fff}
      .page{padding:0}
      .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .kpi-accent{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .badge{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .analysis-icon{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .sec-hd{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .kpi-val{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .charts-grid{break-inside:avoid}
      .analysis-item{break-inside:avoid}
      @page{margin:0;size:A4}
    }
  </style>
</head>
<body>
<div class="page">

  <!-- COVER -->
  <div class="cover">
    <div class="cover-top">
      <div class="cover-brand">
        <div class="cover-icon">🗄️</div>
        <div>
          <div class="cover-title">Reporte de Prueba de Carga</div>
          <div class="cover-sub">Simulador DB &nbsp;·&nbsp; ${modeLabel} &nbsp;·&nbsp; v1.9.0</div>
        </div>
      </div>
      <span class="status-badge" style="color:${overallColor};border-color:${overallColor};background:${overallColor}22">${overallLabel}</span>
    </div>
    <div class="cover-meta">
      <div class="meta-cell"><div class="meta-lbl">Motor${compareMode ? 'es' : ''}</div><div class="meta-val">${engineCfg.emoji} ${engineCfg.name}${compareMode ? ` vs ${engineCfgB.emoji} ${engineCfgB.name}` : ''}</div></div>
      <div class="meta-cell"><div class="meta-lbl">Fecha</div><div class="meta-val">${reportDate}</div></div>
      <div class="meta-cell"><div class="meta-lbl">Duración</div><div class="meta-val">${progressiveMode ? 'hasta saturar' : `${duration} s`}</div></div>
      <div class="meta-cell"><div class="meta-lbl">Usuarios máx.</div><div class="meta-val">${progressiveMode ? (breakingPoint ?? metrics.currentUsers) : maxUsers}</div></div>
      <div class="meta-cell"><div class="meta-lbl">Rampa</div><div class="meta-val">${progressiveMode ? `+${PROG_STEP_USERS}/${PROG_STEP_SECONDS}s` : `${rampUp} s`}</div></div>
      <div class="meta-cell"><div class="meta-lbl">Consultas</div><div class="meta-val">${activeQTs}</div></div>
    </div>
  </div>

  <!-- KPI STRIP -->
  <div class="kpi-strip">
    <div class="kpi">
      <div class="kpi-accent" style="background:linear-gradient(90deg,#10b981,#059669)"></div>
      <div class="kpi-val" style="color:#059669">${metrics.peakTps}</div>
      <div class="kpi-lbl">Pico TPS</div>
      <div class="kpi-sub">transacciones / segundo</div>
    </div>
    <div class="kpi">
      <div class="kpi-accent" style="background:linear-gradient(90deg,#3b82f6,#2563eb)"></div>
      <div class="kpi-val" style="color:#2563eb">${metrics.latency.toFixed(0)}<span style="font-size:18px">ms</span></div>
      <div class="kpi-lbl">Latencia Final</div>
      <div class="kpi-sub">promedio: ${avgLatency.toFixed(0)}ms</div>
    </div>
    <div class="kpi">
      <div class="kpi-accent" style="background:linear-gradient(90deg,#f59e0b,#d97706)"></div>
      <div class="kpi-val" style="color:#d97706">${metrics.currentUsers}</div>
      <div class="kpi-lbl">Usuarios Activos</div>
      <div class="kpi-sub">de ${maxUsers} configurados</div>
    </div>
    <div class="kpi">
      <div class="kpi-accent" style="background:linear-gradient(90deg,${metrics.totalErrors === 0 ? '#10b981,#059669' : '#ef4444,#dc2626'})"></div>
      <div class="kpi-val" style="color:${metrics.totalErrors === 0 ? '#059669' : '#dc2626'}">${metrics.totalErrors}</div>
      <div class="kpi-lbl">Errores Totales</div>
      <div class="kpi-sub">durante toda la prueba</div>
    </div>
  </div>

  <!-- CHARTS -->
  <div class="section section-first" style="border-top:1px solid #e2e8f0">
    <div class="sec-hd">
      <div class="sec-icon" style="background:#dbeafe;color:#2563eb">📈</div>
      <h2>Evolución del Rendimiento</h2>
    </div>
    <div class="charts-grid" style="border-top:none">
      <div class="chart-cell">
        <div class="chart-label">TPS — Transacciones por segundo</div>
        <div class="chart-peak-val" style="color:#059669">${metrics.peakTps} <span style="font-size:14px;font-weight:500;color:#94a3b8">pico</span></div>
        ${sparkline(tpsData, '#10b981')}
      </div>
      <div class="chart-cell">
        <div class="chart-label">Latencia de respuesta (ms)</div>
        <div class="chart-peak-val" style="color:#2563eb">${metrics.latency.toFixed(0)}<span style="font-size:14px">ms</span> <span style="font-size:14px;font-weight:500;color:#94a3b8">final</span></div>
        ${sparkline(latencyData, '#3b82f6')}
      </div>
      <div class="chart-cell">
        <div class="chart-label">Uso estimado de CPU (%)</div>
        <div class="chart-peak-val" style="color:${metrics.cpuUsage >= 90 ? '#dc2626' : metrics.cpuUsage >= 70 ? '#d97706' : '#059669'}">${metrics.cpuUsage.toFixed(0)}<span style="font-size:14px">%</span></div>
        ${sparkline(cpuData, metrics.cpuUsage >= 90 ? '#ef4444' : '#f59e0b')}
      </div>
      <div class="chart-cell">
        <div class="chart-label">Conexiones activas</div>
        <div class="chart-peak-val" style="color:${metrics.connections >= store.simulation.connectionLimit ? '#dc2626' : '#7c3aed'}">${metrics.connections} <span style="font-size:14px;font-weight:500;color:#94a3b8">/ ${store.simulation.connectionLimit}</span></div>
        ${sparkline(connData, '#8b5cf6')}
      </div>
    </div>
  </div>
${progressiveSectionHtml}
${compareSectionHtml}

  <!-- CONFIG + METRICS -->
  <div class="section two-col" style="border-top:none">
    <div class="col-left">
      <div class="sec-hd">
        <div class="sec-icon" style="background:#dbeafe;color:#2563eb">⚙️</div>
        <h2>Configuración de la prueba</h2>
      </div>
      <div class="sec-body">
        <table class="kv">
          <tr><td>Motor de base de datos</td><td>${engineCfg.emoji} ${engineCfg.name}</td></tr>
          <tr><td>Duración total</td><td>${duration} segundos</td></tr>
          <tr><td>Usuarios virtuales máx.</td><td>${maxUsers}</td></tr>
          <tr><td>Tiempo de rampa (ramp-up)</td><td>${rampUp} segundos</td></tr>
          <tr><td>Tipos de consulta activos</td><td>${activeQTs}</td></tr>
          <tr><td>Latencia de red simulada</td><td>${store.simulation.networkLatency} ms</td></tr>
          <tr><td>Límite de conexiones</td><td>${store.simulation.connectionLimit}</td></tr>
          <tr><td>Simulación de errores</td><td>${store.simulation.simulateErrors ? `Sí (${store.simulation.errorProbability}%)` : 'No'}</td></tr>
        </table>
      </div>
    </div>
    <div>
      <div class="sec-hd">
        <div class="sec-icon" style="background:#dcfce7;color:#16a34a">📊</div>
        <h2>Métricas finales</h2>
      </div>
      <div class="sec-body">
        <table class="kv">
          <tr><td>TPS al finalizar</td><td>${metrics.tps}</td></tr>
          <tr><td>Pico de TPS alcanzado</td><td>${metrics.peakTps}</td></tr>
          <tr><td>Latencia al finalizar</td><td>${metrics.latency.toFixed(1)} ms</td></tr>
          <tr><td>Latencia promedio</td><td>${avgLatency.toFixed(1)} ms</td></tr>
          <tr><td>Uso de CPU estimado</td><td>${metrics.cpuUsage.toFixed(1)} %</td></tr>
          <tr><td>Conexiones activas (pico)</td><td>${metrics.connections} / ${store.simulation.connectionLimit}</td></tr>
          <tr><td>Errores último segundo</td><td>${metrics.errorCount}</td></tr>
          <tr><td>Errores totales</td><td>${metrics.totalErrors}</td></tr>
        </table>
      </div>
    </div>
  </div>

  <!-- ANALYSIS -->
  <div class="section" style="border-top:none">
    <div class="sec-hd">
      <div class="sec-icon" style="background:#ede9fe;color:#7c3aed">🔍</div>
      <h2>Análisis Automático de Resultados</h2>
    </div>
    <div class="sec-body">
      ${analysis.map(a => {
        const isGood = a.includes('#16a34a')
        const isWarn = a.includes('#d97706')
        const bg     = isGood ? '#f0fdf4' : isWarn ? '#fffbeb' : '#fef2f2'
        const border = isGood ? '#bbf7d0' : isWarn ? '#fde68a' : '#fecaca'
        const icon   = isGood ? '✅' : isWarn ? '⚠️' : '🔴'
        const clean  = a.replace(/<li>/, '').replace(/<\/li>/, '').replace(/<strong[^>]*>/g,'<strong>').replace(/<\/strong>/g,'</strong>')
        return `<div class="analysis-item">
          <div class="analysis-icon" style="background:${bg};border:1px solid ${border}">${icon}</div>
          <div class="analysis-text">${clean}</div>
        </div>`
      }).join('')}
    </div>
  </div>

  <!-- LOGS -->
  <div class="section" style="border-top:none">
    <div class="sec-hd">
      <div class="sec-icon" style="background:#fef9c3;color:#ca8a04">📋</div>
      <h2>Muestra de Scripts Ejecutados — últimos ${Math.min(scriptLogs.length, 20)}</h2>
    </div>
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead>
          <tr><th>Hora</th><th>Tipo</th>${compareMode ? '<th>Motor</th>' : ''}<th>Estado</th><th>Usuarios</th><th>TPS</th><th>Latencia</th><th>Script ejecutado</th></tr>
        </thead>
        <tbody>
          ${scriptLogs.slice(-20).reverse().map(log => {
            const typeColor: Record<string, string> = { SELECT:'#2563eb', INSERT:'#16a34a', UPDATE:'#d97706', DELETE:'#dc2626' }
            const tc = typeColor[log.type] ?? '#64748b'
            return `<tr>
              <td style="white-space:nowrap;color:#64748b">${log.timestamp}</td>
              <td><span class="badge" style="color:${tc};border-color:${tc}33;background:${tc}0d">${log.type}</span></td>
              ${compareMode ? `<td>${log.engineLabel ?? '—'}</td>` : ''}
              <td><span class="badge" style="color:${log.status==='OK'?'#16a34a':'#dc2626'};border-color:${log.status==='OK'?'#bbf7d0':'#fecaca'};background:${log.status==='OK'?'#f0fdf4':'#fef2f2'}">${log.status}</span></td>
              <td style="text-align:center">${log.users}</td>
              <td style="text-align:center">${log.tps}</td>
              <td style="text-align:center;font-weight:600">${log.latency.toFixed(0)}ms</td>
              <td><div class="mono">${log.script.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div></td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="report-footer">
    <div class="footer-left">
      <strong style="color:#475569">Simulador DB v1.9.0</strong> &nbsp;·&nbsp; Multi-Engine Database Simulator<br>
      Generado el ${stamp}
    </div>
    <div class="footer-right">
      Motor: ${engineCfg.emoji} ${engineCfg.name}${compareMode ? ` vs ${engineCfgB.emoji} ${engineCfgB.name}` : ''} &nbsp;·&nbsp; Duración: ${progressiveMode ? 'hasta saturar' : `${duration}s`} &nbsp;·&nbsp; Usuarios: ${progressiveMode ? (breakingPoint ?? metrics.currentUsers) : maxUsers}<br>
      <span style="color:${overallColor};font-weight:600">${overallLabel}</span>
    </div>
  </div>

</div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=1000,height=800')
    if (!win) return
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 800)
  }

  // ── Stop ────────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setStatus(prev => {
      if (prev === 'running' || prev === 'paused') {
        onActivityChange?.({ engine: 'mysql', queryTypes: { SELECT: false, INSERT: false, UPDATE: false, DELETE: false }, status: 'completed', tps: 0, currentUsers: 0, maxUsers: 0, cpuUsage: 0, latency: 0 })

        const avgLatency  = sampleCountRef.current > 0 ? latencySumRef.current / sampleCountRef.current : 0
        const avgLatencyB = sampleCountRef.current > 0 ? latencySumRefB.current / sampleCountRef.current : 0
        const qtLabel = (Object.entries(queryTypes) as [string, boolean][]).filter(([, v]) => v).map(([k]) => k).join('+')

        const entry = saveHistoryEntry({
          mode: progressiveMode ? 'progressive' : compareMode ? 'compare' : 'normal',
          engine,
          engineB: compareMode ? engineB : undefined,
          duration,
          maxUsers: progressiveMode ? (breakingPointRef.current ?? progUsersRef.current) : maxUsers,
          rampUp,
          queryTypes: qtLabel,
          peakTps: peakRef.current,
          avgLatency,
          finalLatency: lastLatencyRef.current,
          totalErrors: totalErrRef.current,
          finalCpu: lastCpuRef.current,
          breakingPointUsers: breakingPointRef.current ?? undefined,
          peakTpsB: compareMode ? peakRefB.current : undefined,
          avgLatencyB: compareMode ? avgLatencyB : undefined,
          totalErrorsB: compareMode ? totalErrRefB.current : undefined,
        })
        setHistoryEntries(prevList => [entry, ...prevList].slice(0, 20))

        return 'completed'
      }
      return prev
    })
  }, [onActivityChange, queryTypes, progressiveMode, compareMode, engine, engineB, duration, maxUsers, rampUp])

  // ── Pause / Resume ──────────────────────────────────────────────────────────
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    pauseStartRef.current = Date.now()
    setStatus(prev => (prev === 'running' ? 'paused' : prev))
  }, [])

  // ── Reset to idle ──────────────────────────────────────────────────────────
  const resetSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    startTimeRef.current = 0
    peakRef.current = 0
    peakRefB.current = 0
    totalErrRef.current = 0
    totalErrRefB.current = 0
    latencySumRef.current = 0
    latencySumRefB.current = 0
    sampleCountRef.current = 0
    lastCpuRef.current = 0
    lastLatencyRef.current = 0
    pausedDurationRef.current = 0
    pauseStartRef.current = 0
    progUsersRef.current = PROG_USERS_START
    progStepAtRef.current = 0
    satStreakRef.current = 0
    breakingPointRef.current = null
    setStatus('idle')
    setBreakingPoint(null)
    setMetrics(EMPTY_METRICS)
    setMetricsB(EMPTY_METRICS)
    setLatencyData([])
    setTpsData([])
    setCpuData([])
    setConnData([])
    setLatencyDataB([])
    setTpsDataB([])
    setCpuDataB([])
    setConnDataB([])
    setScriptLogs([])
    setLogFilter('ALL')
    setLogSearch('')
    setLogSort('TIME_DESC')
  }, [])

  // ── Interval principal (compartido por start y resume) ──────────────────────
  const beginInterval = useCallback(() => {
    const connLimit  = store.simulation.connectionLimit
    const netLatency = store.simulation.networkLatency
    const errEnabled = store.simulation.simulateErrors
    const errProb    = store.simulation.errorProbability / 100

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000

      if (!progressiveMode && elapsed >= duration) { stop(); return }
      if (progressiveMode && elapsed >= duration * 4) { stop(); return } // tope de seguridad

      // ── Usuarios virtuales: rampa configurada o ataque progresivo automático ──
      let currentUsers: number
      if (progressiveMode) {
        if (elapsed - progStepAtRef.current >= PROG_STEP_SECONDS) {
          progStepAtRef.current = elapsed
          progUsersRef.current = Math.min(progUsersRef.current + PROG_STEP_USERS, PROG_USERS_CAP)
        }
        currentUsers = progUsersRef.current
      } else {
        const rampPct = Math.min(elapsed / Math.max(rampUp, 1), 1)
        currentUsers = Math.min(Math.floor(rampPct * maxUsers), maxUsers)
      }

      const resultA = computeEngineTick({
        currentUsers, perfFactor: engineCfg.perfFactor, connLimit, netLatency, errEnabled, errProb,
      })
      peakRef.current      = Math.max(peakRef.current, resultA.tps)
      totalErrRef.current += resultA.errorCount
      latencySumRef.current += resultA.latency
      sampleCountRef.current += 1
      lastCpuRef.current = resultA.cpuUsage
      lastLatencyRef.current = resultA.latency

      const resultB = compareMode
        ? computeEngineTick({ currentUsers, perfFactor: engineCfgB.perfFactor, connLimit, netLatency, errEnabled, errProb })
        : null
      if (resultB) {
        peakRefB.current       = Math.max(peakRefB.current, resultB.tps)
        totalErrRefB.current  += resultB.errorCount
        latencySumRefB.current += resultB.latency
      }

      // ── Detección del punto de saturación (ataque progresivo) ──
      if (progressiveMode && breakingPointRef.current === null) {
        const saturated = resultA.cpuUsage >= 92 || resultA.errorCount > 0
        satStreakRef.current = saturated ? satStreakRef.current + 1 : 0
        if (satStreakRef.current >= PROG_SATURATION_STREAK) {
          breakingPointRef.current = currentUsers
          setBreakingPoint(currentUsers)
          stop()
          return
        }
      }

      const scriptsPerTick = Math.max(1, Math.min(4, Math.ceil(resultA.tps / 250)))
      const tickLogs = Array.from({ length: scriptsPerTick }, (_, index) => {
        const type = pickQueryType(Math.floor(elapsed * 10) + index)
        const forceError = errEnabled
          ? Math.random() < Math.min(0.5, errProb * 2)
          : resultA.cpuUsage >= 92 && Math.random() < 0.25
        return createLogEntry(
          type, Math.floor(elapsed * 2) + index, currentUsers, resultA.tps, resultA.latency, forceError,
          engine, compareMode ? engineCfg.name : undefined,
        )
      })

      if (resultB) {
        const typeB = pickQueryType(Math.floor(elapsed * 10) + 99)
        const forceErrorB = errEnabled
          ? Math.random() < Math.min(0.5, errProb * 2)
          : resultB.cpuUsage >= 92 && Math.random() < 0.25
        tickLogs.push(createLogEntry(
          typeB, Math.floor(elapsed * 2) + 99, currentUsers, resultB.tps, resultB.latency, forceErrorB,
          engineB, engineCfgB.name,
        ))
      }

      const snap: LoadMetrics = {
        currentUsers,
        tps: resultA.tps,
        peakTps: peakRef.current,
        latency: resultA.latency,
        cpuUsage: resultA.cpuUsage,
        connections: resultA.connections,
        errorCount: resultA.errorCount,
        elapsedSeconds: elapsed,
        totalErrors: totalErrRef.current,
      }
      setMetrics(snap)
      setLatencyData(prev => [...prev.slice(-59), resultA.latency])
      setTpsData(prev     => [...prev.slice(-59), resultA.tps])
      setCpuData(prev     => [...prev.slice(-59), resultA.cpuUsage])
      setConnData(prev    => [...prev.slice(-59), resultA.connections])

      if (resultB) {
        const snapB: LoadMetrics = {
          currentUsers,
          tps: resultB.tps,
          peakTps: peakRefB.current,
          latency: resultB.latency,
          cpuUsage: resultB.cpuUsage,
          connections: resultB.connections,
          errorCount: resultB.errorCount,
          elapsedSeconds: elapsed,
          totalErrors: totalErrRefB.current,
        }
        setMetricsB(snapB)
        setLatencyDataB(prev => [...prev.slice(-59), resultB.latency])
        setTpsDataB(prev     => [...prev.slice(-59), resultB.tps])
        setCpuDataB(prev     => [...prev.slice(-59), resultB.cpuUsage])
        setConnDataB(prev    => [...prev.slice(-59), resultB.connections])
      }

      setScriptLogs(prev => [...prev.slice(-39), ...tickLogs].slice(-40))

      onActivityChange?.({
        engine, queryTypes, status: 'running',
        tps: resultA.tps, currentUsers, maxUsers: progressiveMode ? currentUsers : maxUsers,
        cpuUsage: resultA.cpuUsage, latency: resultA.latency,
      })
    }, 500)
  }, [duration, maxUsers, rampUp, stop, store.simulation, queryTypes, engine, engineB, engineCfg, engineCfgB, compareMode, progressiveMode, onActivityChange])

  // ── Start ───────────────────────────────────────────────────────────────────
  const start = useCallback(() => {
    peakRef.current = 0
    peakRefB.current = 0
    totalErrRef.current = 0
    totalErrRefB.current = 0
    latencySumRef.current = 0
    latencySumRefB.current = 0
    sampleCountRef.current = 0
    lastCpuRef.current = 0
    lastLatencyRef.current = 0
    pausedDurationRef.current = 0
    progUsersRef.current = PROG_USERS_START
    progStepAtRef.current = 0
    satStreakRef.current = 0
    breakingPointRef.current = null

    setStatus('running')
    setBreakingPoint(null)
    setMetrics(EMPTY_METRICS)
    setMetricsB(EMPTY_METRICS)
    setLatencyData([])
    setTpsData([])
    setCpuData([])
    setConnData([])
    setLatencyDataB([])
    setTpsDataB([])
    setCpuDataB([])
    setConnDataB([])
    setScriptLogs([])

    startTimeRef.current = Date.now()
    beginInterval()
  }, [beginInterval])

  // ── Resume (desde pausa, sin perder progreso) ───────────────────────────────
  const resume = useCallback(() => {
    if (status !== 'paused') return
    pausedDurationRef.current += Date.now() - pauseStartRef.current
    setStatus('running')
    beginInterval()
  }, [status, beginInterval])

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  // ── Derived display values ──────────────────────────────────────────────────
  const progressPct = status === 'completed' ? 100
    : (status === 'running' || status === 'paused') && !progressiveMode ? Math.min(100, (metrics.elapsedSeconds / duration) * 100)
    : 0
  const timeLeft    = Math.max(0, duration - metrics.elapsedSeconds)
  const isSaturated = metrics.cpuUsage >= 90 || metrics.connections >= store.simulation.connectionLimit * 0.95
  const hasErrors   = metrics.errorCount > 0
  const isPaused    = status === 'paused'

  // ── Veredicto automático (solo al completar) ────────────────────────────────
  const verdictA = status === 'completed' ? computeVerdict(metrics.totalErrors, average(latencyData)) : null
  const verdictB = status === 'completed' && compareMode ? computeVerdict(metricsB.totalErrors, average(latencyDataB)) : null

  // ── Toggle query type ───────────────────────────────────────────────────────
  function toggleQT(qt: keyof typeof queryTypes) {
    const active = Object.values(queryTypes).filter(Boolean)
    if (active.length === 1 && queryTypes[qt]) return // keep at least one
    setQueryTypes(prev => ({ ...prev, [qt]: !prev[qt] }))
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={standalone ? 'flex h-screen bg-surface-900' : 'fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4'}>
      <div className={standalone ? 'flex-1 flex flex-col overflow-hidden' : 'w-full max-w-5xl bg-surface-900 border border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden'}
        style={standalone ? undefined : { maxHeight: '92vh' }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-surface-800 border-b border-surface-600 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-900/40 shrink-0">
            <Activity size={15} className="text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">Simulador de Carga</span>
              {standalone && userName && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-700 text-slate-400 border border-surface-600 shrink-0 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                  {userName}
                  {onBack && status === 'idle' && (
                    <button
                      onClick={onBack}
                      className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-surface-500 text-slate-500 hover:text-white transition-colors"
                      title="Cambiar usuario"
                    >
                      <X size={9} />
                    </button>
                  )}
                </span>
              )}
              {status === 'running' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/20 text-amber-300 border border-amber-800/30 shrink-0">
                  EN EJECUCIÓN
                </span>
              )}
              {status === 'paused' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-500/40 shrink-0">
                  PAUSADO
                </span>
              )}
              {status === 'completed' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/40 shrink-0">
                  COMPLETADO
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              {status === 'idle'      && 'Configura los parámetros y presiona Iniciar Prueba'}
              {status === 'running'   && (progressiveMode
                ? `Ataque progresivo: ${metrics.currentUsers} usuarios · buscando punto de saturación...`
                : `Corriendo: ${metrics.elapsedSeconds.toFixed(0)}s de ${duration}s · Usuarios virtuales: ${metrics.currentUsers}/${maxUsers}`)}
              {status === 'paused'    && `Pausado en ${metrics.elapsedSeconds.toFixed(0)}s · Usuarios virtuales: ${metrics.currentUsers}`}
              {status === 'completed' && (breakingPoint !== null
                ? `Punto de saturación encontrado: ${breakingPoint} usuarios · Pico TPS: ${metrics.peakTps}`
                : `Prueba completada · ${metrics.totalErrors} errores totales · Pico TPS: ${metrics.peakTps}`)}
            </div>
          </div>

          <div className="flex-1" />

          {status === 'idle' && (
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-slate-300 bg-surface-700 hover:bg-surface-600 border border-surface-600 transition-all shrink-0"
            >
              <History size={11} />
              Historial
            </button>
          )}
          {status === 'running' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={pause}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-amber-300 bg-amber-900/20 hover:bg-amber-900/30 border border-amber-800/40 transition-all"
              >
                <Pause size={11} className="fill-amber-300" />
                Pausar
              </button>
              <button
                onClick={stop}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-800/40 transition-all"
              >
                <Square size={11} className="fill-red-400" />
                Detener
              </button>
            </div>
          )}
          {status === 'paused' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={resume}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-800/40 transition-all"
              >
                <Play size={11} className="fill-emerald-300" />
                Reanudar
              </button>
              <button
                onClick={stop}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-800/40 transition-all"
              >
                <Square size={11} className="fill-red-400" />
                Detener
              </button>
            </div>
          )}
          {status === 'completed' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-slate-300 bg-surface-700 hover:bg-surface-600 border border-surface-600 transition-all"
              >
                <History size={11} />
                Historial
              </button>
              <button
                onClick={generateHtmlReport}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-800/40 transition-all"
              >
                <Download size={11} />
                Exportar PDF
              </button>
              <button
                onClick={resetSimulation}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-slate-200 bg-surface-700 border border-surface-600 hover:bg-surface-600 transition-all"
              >
                <Play size={11} />
                Nueva prueba
              </button>
            </div>
          )}
          {!standalone && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-surface-600 transition-all ml-1 shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Progress bar ───────────────────────────────────────────────────── */}
        {status !== 'idle' && (
          <div className="h-1 bg-surface-700 shrink-0">
            <div
              className={`h-full transition-all duration-700 ${
                isSaturated ? 'bg-red-500' : status === 'completed' ? 'bg-blue-500' : 'bg-gradient-to-r from-orange-500 to-red-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">

          {/* ── Config panel (idle / completed) ──────────────────────────────── */}
          {(status === 'idle' || status === 'completed') && (
            <>
            <div className="sm:hidden border-b border-surface-600 shrink-0 bg-surface-800/40">
              <button
                onClick={() => setMobileConfigOpen(v => !v)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:bg-surface-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Database size={12} className="text-orange-400" />
                  Configuración de prueba
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: mobileConfigOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
            </div>
            <div className={`sm:w-60 sm:border-r border-surface-600 flex-col shrink-0 sm:overflow-y-auto bg-surface-800/40 ${mobileConfigOpen ? 'flex' : 'hidden sm:flex'}`}>
              {standalone && onBack && status === 'idle' && (
                <div className="px-4 pt-4 pb-0">
                  <button
                    onClick={onBack}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 bg-surface-700 border border-surface-600 hover:bg-surface-600 hover:text-white hover:border-surface-500 transition-all group"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 group-hover:-translate-x-0.5 transition-transform">
                      <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
                    </svg>
                    Cambiar usuario
                  </button>
                </div>
              )}
              <div className="p-4 flex flex-col gap-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Configuración</p>

                {/* Engine selector */}
                <div>
                  <label className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Database size={10} /> Motor de BD
                  </label>
                  <select
                    value={engine}
                    onChange={e => setEngine(e.target.value as EngineType)}
                    disabled={status !== 'idle'}
                    className={`w-full h-8 px-2.5 text-xs bg-surface-700 border border-surface-600 rounded-lg text-slate-200 focus:outline-none transition-colors ${status !== 'idle' ? 'opacity-60 cursor-not-allowed' : 'focus:border-blue-500'}`}
                  >
                    {Object.values(ENGINE_CONFIGS).map(cfg => (
                      <option key={cfg.type} value={cfg.type}>{cfg.emoji} {cfg.name}</option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-[11px] text-slate-500 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5"><Clock size={10} /> Duración</span>
                    <span className="text-white font-semibold">{duration}s</span>
                  </label>
                  <input type="range" min={30} max={600} step={30} value={duration}
                    onChange={e => setDuration(+e.target.value)}
                    disabled={status !== 'idle'}
                    className={`w-full accent-orange-500 ${status !== 'idle' ? 'opacity-60' : ''}`} />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                    <span>30s</span><span>600s</span>
                  </div>
                </div>

                {/* Max virtual users */}
                <div>
                  <label className="text-[11px] text-slate-500 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5"><Users size={10} /> Usuarios virtuales</span>
                    <span className="text-white font-semibold">{progressiveMode ? 'auto' : maxUsers}</span>
                  </label>
                  <input type="range" min={10} max={500} step={10} value={maxUsers}
                    onChange={e => setMaxUsers(+e.target.value)}
                    disabled={status !== 'idle' || progressiveMode}
                    className={`w-full accent-orange-500 ${status !== 'idle' || progressiveMode ? 'opacity-60' : ''}`} />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                    <span>10</span><span>500</span>
                  </div>
                </div>

                {/* Ramp-up */}
                <div>
                  <label className="text-[11px] text-slate-500 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5"><TrendingUp size={10} /> Rampa de usuarios</span>
                    <span className="text-white font-semibold">{progressiveMode ? 'auto' : `${rampUp}s`}</span>
                  </label>
                  <input type="range" min={5} max={120} step={5} value={rampUp}
                    onChange={e => setRampUp(+e.target.value)}
                    disabled={status !== 'idle' || progressiveMode}
                    className={`w-full accent-orange-500 ${status !== 'idle' || progressiveMode ? 'opacity-60' : ''}`} />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                    <span>5s</span><span>120s</span>
                  </div>
                </div>

                {/* Query types */}
                <div>
                  <label className="text-[11px] text-slate-500 block mb-2">Tipos de consulta</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(queryTypes) as Array<keyof typeof queryTypes>).map(qt => (
                      <label key={qt}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-700 border border-surface-600 transition-colors ${status !== 'idle' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-surface-500'}`}>
                        <input type="checkbox" checked={queryTypes[qt]}
                          onChange={() => toggleQT(qt)}
                          disabled={status !== 'idle'}
                          className={`accent-orange-500 w-3 h-3 shrink-0 ${status !== 'idle' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                        <span className="text-[11px] text-slate-400">{qt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Modos especiales */}
                <div className="pt-1 border-t border-surface-600/60 flex flex-col gap-2">
                  <label className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-700 border border-surface-600 transition-colors ${status !== 'idle' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-surface-500'}`}>
                    <input type="checkbox" checked={compareMode}
                      onChange={() => {
                        setCompareMode(v => !v)
                        setProgressiveMode(false)
                      }}
                      disabled={status !== 'idle'}
                      className={`accent-purple-500 w-3 h-3 shrink-0 ${status !== 'idle' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                    <GitCompare size={11} className="text-purple-400 shrink-0" />
                    <span className="text-[11px] text-slate-300">Comparar 2 motores</span>
                  </label>

                  {compareMode && (
                    <div>
                      <label className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-1.5">
                        <Database size={10} /> Motor B
                      </label>
                      <select
                        value={engineB}
                        onChange={e => setEngineB(e.target.value as EngineType)}
                        disabled={status !== 'idle'}
                        className={`w-full h-8 px-2.5 text-xs bg-surface-700 border border-surface-600 rounded-lg text-slate-200 focus:outline-none transition-colors ${status !== 'idle' ? 'opacity-60 cursor-not-allowed' : 'focus:border-purple-500'}`}
                      >
                        {Object.values(ENGINE_CONFIGS).filter(cfg => cfg.type !== engine).map(cfg => (
                          <option key={cfg.type} value={cfg.type}>{cfg.emoji} {cfg.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <label className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-700 border border-surface-600 transition-colors ${status !== 'idle' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-surface-500'}`}>
                    <input type="checkbox" checked={progressiveMode}
                      onChange={() => {
                        setProgressiveMode(v => !v)
                        setCompareMode(false)
                      }}
                      disabled={status !== 'idle'}
                      className={`accent-red-500 w-3 h-3 shrink-0 ${status !== 'idle' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                    <Gauge size={11} className="text-red-400 shrink-0" />
                    <span className="text-[11px] text-slate-300">Ataque progresivo</span>
                  </label>
                  {progressiveMode && (
                    <p className="text-[10px] text-slate-500 leading-relaxed px-0.5">
                      Ignora "Usuarios virtuales" y "Rampa": sube {PROG_STEP_USERS} usuarios cada {PROG_STEP_SECONDS}s hasta detectar saturación sostenida.
                    </p>
                  )}
                </div>
              </div>

              {/* Simulation params note */}
              <div className="mx-4 mb-4 p-2.5 bg-surface-700/60 rounded-lg border border-surface-600/60">
                <div className="text-[10px] text-slate-500 space-y-0.5 leading-relaxed">
                  <div className="flex justify-between">
                    <span>Latencia de red</span>
                    <span className="text-slate-300">{store.simulation.networkLatency}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Límite conexiones</span>
                    <span className="text-slate-300">{store.simulation.connectionLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Simular errores</span>
                    <span className={store.simulation.simulateErrors ? 'text-amber-400' : 'text-slate-600'}>
                      {store.simulation.simulateErrors ? `Sí (${store.simulation.errorProbability}%)` : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4 mt-auto">
                <button
                  onClick={status === 'completed' ? resetSimulation : start}
                  className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white
                             bg-gradient-to-r from-orange-500 to-red-600
                             hover:from-orange-400 hover:to-red-500
                             shadow-lg shadow-orange-900/30 transition-all active:scale-[0.98]"
                >
                  <Play size={13} className="fill-white" />
                  {status === 'completed' ? 'Nueva Prueba' : 'Iniciar Prueba'}
                </button>
              </div>
            </div>
            </>
          )}

          {/* ── Main area ─────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col gap-3">

            {/* ── Idle placeholder ─────────────────────────────────────────────── */}
            {status === 'idle' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/20 flex items-center justify-center">
                    <Activity size={28} className="text-orange-400" />
                  </div>
                  <p className="text-slate-300 font-semibold mb-1">Listo para simular carga</p>
                  <p className="text-slate-500 text-sm mb-5">
                    Configura los parámetros a la izquierda y presiona&nbsp;
                    <span className="text-orange-400 font-medium">Iniciar Prueba</span>.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: <Users size={14} />,   label: 'Usuarios virtuales', val: maxUsers },
                      { icon: <Clock size={14} />,   label: 'Duración',           val: `${duration}s` },
                      { icon: <Database size={14} />,label: 'Motor',              val: engineCfg.name },
                    ].map(({ icon, label, val }) => (
                      <div key={label} className="bg-surface-800 rounded-xl p-3 border border-surface-600">
                        <div className="flex justify-center text-slate-500 mb-1.5">{icon}</div>
                        <div className="text-white font-bold text-sm">{val}</div>
                        <div className="text-slate-600 text-[10px] mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Running / Completed ───────────────────────────────────────────── */}
            {status !== 'idle' && (
              <>
                {/* Veredicto automático */}
                {!compareMode && status === 'completed' && verdictA && (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shrink-0 ${VERDICT_STYLES[verdictA.accent]}`}>
                    <span className="text-xl leading-none">{verdictA.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{verdictA.label}</span>
                      <span className="text-[11px] opacity-80">
                        Basado en {metrics.totalErrors} errores totales y {average(latencyData).toFixed(0)}ms de latencia promedio
                      </span>
                    </div>
                  </div>
                )}

                {/* Alert banners */}
                {progressiveMode && breakingPoint !== null && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-red-900/20 border border-red-800/40 rounded-xl shrink-0">
                    <Gauge size={14} className="text-red-400 shrink-0" />
                    <span className="text-xs text-red-300">
                      Punto de saturación detectado en <strong className="font-bold">{breakingPoint} usuarios</strong> concurrentes — ese es el límite estimado de {engineCfg.name} con esta configuración.
                    </span>
                  </div>
                )}
                {isSaturated && status === 'running' && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-red-900/20 border border-red-800/40 rounded-xl shrink-0">
                    <AlertTriangle size={14} className="text-red-400 shrink-0" />
                    <span className="text-xs text-red-300">
                      Sistema saturado — latencia elevada y posibles errores de conexión detectados
                    </span>
                  </div>
                )}
                {hasErrors && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-amber-900/20 border border-amber-800/40 rounded-xl shrink-0">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-300">
                      {metrics.errorCount} error{metrics.errorCount !== 1 ? 'es' : ''} en el último segundo → BD lenta
                    </span>
                  </div>
                )}

                {compareMode ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
                    <EngineResultPanel
                      title={`Motor A — ${engineCfg.name}`} emoji={engineCfg.emoji} accent="#3b82f6"
                      metrics={metrics} latencyData={latencyData} tpsData={tpsData} cpuData={cpuData} connData={connData}
                      connectionLimit={store.simulation.connectionLimit} maxUsersLabel={maxUsers} verdict={verdictA}
                    />
                    <EngineResultPanel
                      title={`Motor B — ${engineCfgB.name}`} emoji={engineCfgB.emoji} accent="#ec4899"
                      metrics={metricsB} latencyData={latencyDataB} tpsData={tpsDataB} cpuData={cpuDataB} connData={connDataB}
                      connectionLimit={store.simulation.connectionLimit} maxUsersLabel={maxUsers} verdict={verdictB}
                    />
                  </div>
                ) : (
                  <>
                    {/* Charts grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                      <LiveChart data={latencyData} color="#3b82f6" label="Latencia (ms)"
                        unit="ms" warningLevel={200} criticalLevel={400} chartId="lat" />
                      <LiveChart data={tpsData}     color="#10b981" label="TPS (consultas/seg)"
                        unit="" chartId="tps" />
                      <LiveChart data={cpuData}     color="#f59e0b" label="Uso de CPU BD (%)"
                        unit="%" warningLevel={70} criticalLevel={90} chartId="cpu" />
                      <LiveChart data={connData}    color="#8b5cf6" label="Conexiones activas"
                        unit="" chartId="conn" />
                    </div>

                    {/* Critical Indicators panel */}
                    <div className="bg-surface-800 rounded-xl border border-surface-600 overflow-hidden shrink-0">
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-600 bg-surface-800/80">
                        <Zap size={12} className="text-amber-400" />
                        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                          Indicadores Críticos
                        </span>
                      </div>

                      <div className="p-4 space-y-2.5">
                        <MetricBar
                          label="CPU BD"
                          value={metrics.cpuUsage}
                          max={100}
                          unit="%"
                          decimals={1}
                          warningAt={70}
                          criticalAt={90}
                        />
                        <MetricBar
                          label="Conexiones"
                          value={metrics.connections}
                          max={store.simulation.connectionLimit}
                          warningAt={80}
                          criticalAt={95}
                        />
                        <MetricBar
                          label="Usuarios activos"
                          value={metrics.currentUsers}
                          max={progressiveMode ? Math.max(metrics.currentUsers, PROG_USERS_START) : maxUsers}
                          warningAt={85}
                          criticalAt={100}
                        />
                      </div>

                      {/* Stat badges */}
                      <div className="px-4 py-3 border-t border-surface-600 grid grid-cols-3 sm:grid-cols-5 gap-2 divide-x divide-surface-700">
                        <StatBadge label="TPS actual"    value={metrics.tps}                        color="text-emerald-400" />
                        <StatBadge label="Pico TPS"      value={metrics.peakTps}                    color="text-blue-400" />
                        <StatBadge label="Latencia"      value={`${metrics.latency.toFixed(0)}ms`}  color="text-white" />
                        <StatBadge label="Errores/seg"   value={metrics.errorCount}                 color={metrics.errorCount > 0 ? 'text-red-400' : 'text-slate-600'} />
                        <StatBadge label={progressiveMode ? 'Usuarios' : 'Tiempo rest.'}  value={progressiveMode ? metrics.currentUsers : `${timeLeft.toFixed(0)}s`}          color="text-amber-400" />
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-surface-800 rounded-xl border border-surface-600 overflow-hidden shrink-0">
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-surface-600 bg-surface-800/80">
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-orange-400" />
                      <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                        Logs de scripts ejecutados
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <div className="relative">
                        <input
                          value={logSearch}
                          onChange={e => setLogSearch(e.target.value)}
                          placeholder="Buscar..."
                          className="h-7 w-36 px-2.5 pr-7 rounded-lg text-[10px] bg-surface-700 border border-surface-600 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                        />
                        {logSearch && (
                          <button
                            type="button"
                            onClick={() => setLogSearch('')}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-md text-slate-500 hover:text-white hover:bg-surface-600"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                      <select
                        value={logFilter}
                        onChange={e => setLogFilter(e.target.value as 'ALL' | QueryType)}
                        className="h-7 px-2 rounded-lg text-[10px] font-semibold bg-surface-700 border border-surface-600 text-slate-200 focus:outline-none focus:border-orange-500"
                      >
                        <option value="ALL">Todos</option>
                        <option value="SELECT">SELECT</option>
                        <option value="INSERT">INSERT</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                      <select
                        value={logSort}
                        onChange={e => setLogSort(e.target.value as 'TIME_DESC' | 'TIME_ASC' | 'SEVERITY')}
                        className="h-7 px-2 rounded-lg text-[10px] font-semibold bg-surface-700 border border-surface-600 text-slate-200 focus:outline-none focus:border-orange-500"
                      >
                        <option value="TIME_DESC">Tiempo ↓</option>
                        <option value="TIME_ASC">Tiempo ↑</option>
                        <option value="SEVERITY">Severidad</option>
                      </select>
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {visibleLogs.length}/{searchedLogs.length} visibles
                      </span>
                      <span className={`inline-flex items-center gap-1 h-7 px-2 rounded-full text-[10px] font-semibold border ${logSort === 'SEVERITY' ? 'bg-red-900/25 text-red-300 border-red-800/40' : logSort === 'TIME_ASC' ? 'bg-blue-900/25 text-blue-300 border-blue-800/40' : 'bg-orange-900/25 text-orange-300 border-orange-800/40'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${logSort === 'SEVERITY' ? 'bg-red-400' : logSort === 'TIME_ASC' ? 'bg-blue-400' : 'bg-orange-400'}`} />
                        Orden: {logSort === 'SEVERITY' ? 'Severidad' : logSort === 'TIME_ASC' ? 'Tiempo asc.' : 'Tiempo desc.'}
                      </span>
                      <button
                        type="button"
                        onClick={exportLogsAsJson}
                        disabled={visibleLogs.length === 0}
                        className="h-7 px-2.5 rounded-lg text-[10px] font-semibold text-slate-200 bg-surface-700 border border-surface-600 hover:bg-surface-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        JSON
                      </button>
                      <button
                        type="button"
                        onClick={exportLogsAsCsv}
                        disabled={visibleLogs.length === 0}
                        className="h-7 px-2.5 rounded-lg text-[10px] font-semibold text-slate-200 bg-surface-700 border border-surface-600 hover:bg-surface-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        CSV
                      </button>
                    </div>
                  </div>

                  <div ref={logViewportRef} className="max-h-60 overflow-y-auto p-3">
                    {visibleLogs.length === 0 ? (
                      <div className="text-xs text-slate-500 px-1 py-3">
                        {scriptLogs.length === 0
                          ? 'Los scripts simulados aparecerán aquí cuando empiece la prueba.'
                          : 'No hay registros para el filtro o búsqueda seleccionados.'}
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-surface-600 bg-surface-700/60">
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-surface-800/95 backdrop-blur border-b border-surface-600">
                            <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                              <th className="px-3 py-2 font-semibold w-20">Estado</th>
                              <th className="px-3 py-2 font-semibold w-20">Tipo</th>
                              {compareMode && <th className="px-3 py-2 font-semibold w-20">Motor</th>}
                              <th className="px-3 py-2 font-semibold w-24">Hora</th>
                              <th className="px-3 py-2 font-semibold w-20">Users</th>
                              <th className="px-3 py-2 font-semibold w-20">TPS</th>
                              <th className="px-3 py-2 font-semibold w-20">Lat</th>
                              <th className="px-3 py-2 font-semibold">Consulta</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleLogs.map(log => (
                              <tr key={log.id} className="border-t border-surface-600/70 align-top hover:bg-surface-700/80 transition-colors">
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${log.status === 'ERROR' ? 'bg-red-900/30 text-red-400 border-red-800/40' : 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40'}`}>
                                    {log.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-[10px] text-slate-300 font-semibold">{log.type}</td>
                                {compareMode && <td className="px-3 py-2 text-[10px] text-slate-400">{log.engineLabel ?? '—'}</td>}
                                <td className="px-3 py-2 text-[10px] text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                                <td className="px-3 py-2 text-[10px] text-slate-300 tabular-nums">{log.users}</td>
                                <td className="px-3 py-2 text-[10px] text-slate-300 tabular-nums">{log.tps}</td>
                                <td className="px-3 py-2 text-[10px] text-slate-300 tabular-nums">{log.latency.toFixed(0)}ms</td>
                                <td className="px-3 py-2">
                                  <div className="space-y-1">
                                    <div className="text-[11px] text-slate-100 font-mono break-all leading-relaxed">
                                      {log.script}
                                    </div>
                                    <div className="text-[10px] text-slate-500">{log.message}</div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Mini config sidebar (running / paused) ──────────────────────────── */}
          {(status === 'running' || status === 'paused') && (
            <div className="sm:w-44 sm:border-l border-t sm:border-t-0 border-surface-600 flex sm:flex-col shrink-0 bg-surface-800/30">
              <div className="p-3 flex sm:flex-col gap-3 flex-1 flex-wrap sm:flex-nowrap">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-full sm:block">Config activa</p>
                <div className="flex sm:flex-col gap-3 sm:gap-2 flex-wrap text-[11px]">
                  {[
                    ['Motor',    compareMode ? `${engineCfg.emoji} vs ${engineCfgB.emoji}` : `${engineCfg.emoji} ${engineCfg.name}`],
                    ['Usuarios', progressiveMode ? 'auto (progresivo)' : maxUsers],
                    ['Duración', progressiveMode ? 'hasta saturar' : `${duration}s`],
                    ['Rampa',    progressiveMode ? `+${PROG_STEP_USERS}/${PROG_STEP_SECONDS}s` : `${rampUp}s`],
                    ...(isPaused ? [['Estado', '⏸ Pausado']] : []),
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between gap-1">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-slate-300 font-medium text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress mini */}
              <div className="p-3 border-t border-surface-600">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                  <span>Progreso</span>
                  <span className="text-amber-400 font-medium">
                    {progressiveMode ? `${metrics.currentUsers} usuarios` : `${progressPct.toFixed(1)}%`}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700"
                    style={{ width: progressiveMode ? '100%' : `${progressPct}%` }}
                  />
                </div>
                <div className="text-right text-[10px] text-slate-600 mt-1">
                  {progressiveMode ? `racha saturación: ${satStreakRef.current}/${PROG_SATURATION_STREAK}` : `${metrics.elapsedSeconds.toFixed(0)}s / ${duration}s`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel de Historial ─────────────────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface-900 border border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '85vh' }}>
            <div className="flex items-center gap-2.5 px-5 py-3.5 bg-surface-800 border-b border-surface-600 shrink-0">
              <History size={14} className="text-slate-400" />
              <span className="text-sm font-bold text-white flex-1">Historial de pruebas</span>
              {historyEntries.length > 0 && (
                <button
                  onClick={() => { clearHistory(); setHistoryEntries([]) }}
                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-800/40 transition-all"
                >
                  <Trash2 size={11} />
                  Limpiar todo
                </button>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-surface-600 transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 flex flex-col gap-2.5">
              {historyEntries.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Aún no hay pruebas guardadas. Al completar una prueba, su resumen aparecerá aquí.
                </div>
              ) : historyEntries.map(entry => {
                const cfgA = ENGINE_CONFIGS[entry.engine]
                const cfgB = entry.engineB ? ENGINE_CONFIGS[entry.engineB] : null
                const modeLabel = entry.mode === 'compare' ? 'Comparación' : entry.mode === 'progressive' ? 'Ataque progresivo' : 'Normal'
                return (
                  <div key={entry.id} className="bg-surface-800 rounded-xl border border-surface-600 p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white min-w-0">
                        <span className="truncate">
                          {cfgA.emoji} {cfgA.name}{cfgB && <> vs {cfgB.emoji} {cfgB.name}</>}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-700 text-slate-400 border border-surface-600 shrink-0">
                          {modeLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-500">{new Date(entry.savedAt).toLocaleString('es-PE')}</span>
                        <button
                          onClick={() => { deleteHistoryEntry(entry.id); setHistoryEntries(prev => prev.filter(e => e.id !== entry.id)) }}
                          className="w-5 h-5 flex items-center justify-center rounded-md text-slate-500 hover:text-red-400 hover:bg-surface-700 transition-colors"
                          title="Eliminar"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="flex flex-col">
                        <span className="text-slate-500">Pico TPS{cfgB && ' (A)'}</span>
                        <span className="text-blue-400 font-semibold">{entry.peakTps}{cfgB && ` / ${entry.peakTpsB ?? '—'}`}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500">Latencia prom.{cfgB && ' (A)'}</span>
                        <span className="text-slate-200 font-semibold">{entry.avgLatency.toFixed(0)}ms{cfgB && ` / ${entry.avgLatencyB?.toFixed(0) ?? '—'}ms`}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500">Errores{cfgB && ' (A)'}</span>
                        <span className={`font-semibold ${entry.totalErrors > 0 ? 'text-red-400' : 'text-slate-200'}`}>{entry.totalErrors}{cfgB && ` / ${entry.totalErrorsB ?? '—'}`}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500">{entry.breakingPointUsers ? 'Punto saturación' : 'Usuarios máx.'}</span>
                        <span className="text-amber-400 font-semibold">{entry.breakingPointUsers ?? entry.maxUsers}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-surface-700 text-[10px] text-slate-500">
                      Duración: {entry.duration}s · Consultas: {entry.queryTypes}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
