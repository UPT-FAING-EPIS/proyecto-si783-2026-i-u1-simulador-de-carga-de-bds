import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  X, Play, Square, Zap, AlertTriangle, Activity,
  Users, Clock, TrendingUp, Database, Download,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { ENGINE_CONFIGS } from '../types'
import type { EngineType } from '../types'

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
      </svg>
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
}

const LOG_LIMIT = 10

type LoadStatus = 'idle' | 'running' | 'completed'

const EMPTY_METRICS: LoadMetrics = {
  currentUsers: 0, tps: 0, peakTps: 0, latency: 0,
  cpuUsage: 0, connections: 0, errorCount: 0,
  elapsedSeconds: 0, totalErrors: 0,
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function LoadSimulatorModal({ onClose }: { onClose: () => void }) {
  const store = useStore()

  // ── Config ──────────────────────────────────────────────────────────────────
  const [engine,     setEngine]     = useState<EngineType>('mysql')
  const [duration,   setDuration]   = useState(300)
  const [maxUsers,   setMaxUsers]   = useState(200)
  const [rampUp,     setRampUp]     = useState(30)
  const [queryTypes, setQueryTypes] = useState({
    SELECT: true, INSERT: true, UPDATE: false, DELETE: false,
  })

  // ── Runtime state ───────────────────────────────────────────────────────────
  const [status,      setStatus]      = useState<LoadStatus>('idle')
  const [metrics,     setMetrics]     = useState<LoadMetrics>(EMPTY_METRICS)
  const [latencyData, setLatencyData] = useState<number[]>([])
  const [tpsData,     setTpsData]     = useState<number[]>([])
  const [cpuData,     setCpuData]     = useState<number[]>([])
  const [connData,    setConnData]    = useState<number[]>([])
  const [scriptLogs,  setScriptLogs]  = useState<LoadScriptLog[]>([])
  const [logFilter,   setLogFilter]   = useState<'ALL' | QueryType>('ALL')
  const [logSearch,   setLogSearch]   = useState('')
  const [logSort,     setLogSort]     = useState<'TIME_DESC' | 'TIME_ASC' | 'SEVERITY'>('TIME_DESC')
  const engineCfg = ENGINE_CONFIGS[engine]

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const peakRef      = useRef(0)
  const totalErrRef  = useRef(0)
  const logViewportRef = useRef<HTMLDivElement | null>(null)

  const activeQueryTypes = (Object.entries(queryTypes) as Array<[QueryType, boolean]>)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type)

  function pickQueryType(seed: number): QueryType {
    const enabled: QueryType[] = activeQueryTypes.length > 0 ? activeQueryTypes : ['SELECT']
    return enabled[seed % enabled.length]
  }

  function buildScript(type: QueryType, tick: number, userCount: number) {
    const rowIdx    = (userCount % 500) + 1
    const productId = (tick % 7) + 1

    // MongoDB
    if (engine === 'mongodb') {
      switch (type) {
        case 'SELECT': return `db.orders.find({ user_id: ${rowIdx} }).sort({ created_at: -1 }).limit(25)`
        case 'INSERT': return `db.audit_log.insertOne({ user_id: ${rowIdx}, action: "login", created_at: new Date() })`
        case 'UPDATE': return `db.inventory.updateOne({ product_id: ${productId} }, { $inc: { stock: -1 } })`
        case 'DELETE': return `db.sessions.deleteMany({ last_seen: { $lt: new Date(Date.now() - 30*86400000) } })`
      }
    }

    // Redis
    if (engine === 'redis') {
      switch (type) {
        case 'SELECT': return `GET session:${rowIdx}`
        case 'INSERT': return `SETEX session:${rowIdx} 86400 "active"`
        case 'UPDATE': return `HINCRBY inventory:${productId} stock -1`
        case 'DELETE': return `DEL session:${rowIdx}`
      }
    }

    // SQL engines — cada uno con su dialecto correcto
    switch (engine) {
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

  function createLogEntry(type: QueryType, tick: number, currentUsers: number, tps: number, latency: number, errored: boolean): LoadScriptLog {
    const createdAt = Date.now()
    return {
      id: `${createdAt}-${tick}-${type}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt,
      timestamp: new Date().toLocaleTimeString(),
      type,
      script: buildScript(type, tick, currentUsers),
      status: errored ? 'ERROR' : 'OK',
      users: currentUsers,
      tps,
      latency,
      message: errored ? 'Timeout simulado por saturación' : 'Ejecución simulada exitosa',
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

    const avgLatency = latencyData.length > 0
      ? (latencyData.reduce((a, b) => a + b, 0) / latencyData.length)
      : metrics.latency

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

    const logsHtml = scriptLogs.slice(-20).reverse().map(log => {
      const typeColor: Record<string, string> = { SELECT: '#2563eb', INSERT: '#16a34a', UPDATE: '#d97706', DELETE: '#dc2626' }
      const tc = typeColor[log.type] ?? '#64748b'
      return `<tr>
        <td>${log.timestamp}</td>
        <td><span style="background:${tc}1a;color:${tc};border:1px solid ${tc}40;padding:1px 7px;border-radius:8px;font-size:10px;font-weight:700">${log.type}</span></td>
        <td><span style="background:${log.status === 'OK' ? '#dcfce7' : '#fee2e2'};color:${log.status === 'OK' ? '#16a34a' : '#dc2626'};padding:1px 7px;border-radius:8px;font-size:10px;font-weight:700">${log.status}</span></td>
        <td>${log.users}</td>
        <td>${log.tps}</td>
        <td>${log.latency.toFixed(0)}ms</td>
        <td style="font-family:monospace;font-size:10px">${log.script.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
      </tr>`
    }).join('')

    const overallColor = metrics.totalErrors === 0 ? '#16a34a' : metrics.totalErrors < 10 ? '#d97706' : '#dc2626'
    const overallLabel = metrics.totalErrors === 0 ? '✓ Prueba exitosa' : metrics.totalErrors < 10 ? '⚠ Con advertencias' : '✗ Con errores'

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reporte de Carga — ${engineCfg.name} — ${stamp}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#f1f5f9;color:#1e293b;font-size:13px;line-height:1.5}
    .page{max-width:960px;margin:0 auto;padding:32px 20px}
    /* Header */
    .header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#fff;padding:28px 32px;border-radius:16px;margin-bottom:20px}
    .header-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
    .brand{display:flex;align-items:center;gap:12px}
    .brand-icon{width:44px;height:44px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px}
    .brand-text h1{font-size:18px;font-weight:700}
    .brand-text p{color:#94a3b8;font-size:11px;margin-top:2px}
    .status-pill{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;border:1.5px solid}
    .meta-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
    .meta-item .label{color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
    .meta-item .value{color:#e2e8f0;font-weight:600;font-size:13px;margin-top:2px}
    /* Cards */
    .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
    .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.06)}
    .card .val{font-size:30px;font-weight:700;line-height:1}
    .card .lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
    .card .sub{font-size:10px;color:#94a3b8;margin-top:3px}
    /* Charts */
    .charts{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
    .chart-box{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
    .chart-title{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
    .chart-peak{font-size:22px;font-weight:700;margin-bottom:8px}
    /* Sections */
    .section{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
    .sec-head{padding:11px 16px;border-bottom:1px solid #f1f5f9;background:#f8fafc;display:flex;align-items:center;gap:8px}
    .sec-head h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#475569}
    .dot{width:7px;height:7px;border-radius:50%;display:inline-block}
    .sec-body{padding:16px}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
    /* KV */
    .kv{width:100%;border-collapse:collapse}
    .kv tr:not(:last-child) td{border-bottom:1px solid #f1f5f9}
    .kv td{padding:6px 0;font-size:12px}
    .kv td:first-child{color:#64748b}
    .kv td:last-child{font-weight:600;text-align:right}
    /* Table */
    .tbl{width:100%;border-collapse:collapse;font-size:11px}
    .tbl th{padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:600}
    .tbl td{padding:7px 10px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:top}
    .tbl tr:last-child td{border-bottom:none}
    /* Analysis */
    .analysis ul{list-style:none;padding:0}
    .analysis li{padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#334155;line-height:1.5}
    .analysis li:last-child{border-bottom:none}
    /* Footer */
    .footer{text-align:center;padding:16px;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;margin-top:4px}
    @media print{body{background:#fff}.page{padding:12px}.section{break-inside:avoid}}
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-top">
      <div class="brand">
        <div class="brand-icon">🗄️</div>
        <div class="brand-text">
          <h1>Reporte de Prueba de Carga</h1>
          <p>Simulador DB · Multi-Engine Database Simulator</p>
        </div>
      </div>
      <span class="status-pill" style="color:${overallColor};border-color:${overallColor};background:${overallColor}18">${overallLabel}</span>
    </div>
    <div class="meta-grid">
      <div class="meta-item"><div class="label">Motor</div><div class="value">${engineCfg.emoji} ${engineCfg.name}</div></div>
      <div class="meta-item"><div class="label">Fecha</div><div class="value">${reportDate}</div></div>
      <div class="meta-item"><div class="label">Duración</div><div class="value">${duration}s</div></div>
      <div class="meta-item"><div class="label">Usuarios máx.</div><div class="value">${maxUsers}</div></div>
      <div class="meta-item"><div class="label">Rampa</div><div class="value">${rampUp}s</div></div>
      <div class="meta-item"><div class="label">Consultas</div><div class="value">${activeQTs}</div></div>
    </div>
  </div>

  <div class="cards">
    <div class="card"><div class="val" style="color:#10b981">${metrics.peakTps}</div><div class="lbl">Pico TPS</div><div class="sub">transacciones / seg</div></div>
    <div class="card"><div class="val" style="color:#3b82f6">${metrics.latency.toFixed(0)}ms</div><div class="lbl">Latencia final</div><div class="sub">tiempo de respuesta</div></div>
    <div class="card"><div class="val" style="color:#f59e0b">${metrics.currentUsers}</div><div class="lbl">Usuarios activos</div><div class="sub">de ${maxUsers} configurados</div></div>
    <div class="card"><div class="val" style="color:${metrics.totalErrors === 0 ? '#10b981' : '#ef4444'}">${metrics.totalErrors}</div><div class="lbl">Errores totales</div><div class="sub">durante la prueba</div></div>
  </div>

  <div class="charts">
    <div class="chart-box">
      <div class="chart-title">TPS — Transacciones por segundo</div>
      <div class="chart-peak" style="color:#10b981">${metrics.peakTps} <span style="font-size:13px;font-weight:400;color:#64748b">pico</span></div>
      ${sparkline(tpsData, '#10b981')}
    </div>
    <div class="chart-box">
      <div class="chart-title">Latencia (ms)</div>
      <div class="chart-peak" style="color:#3b82f6">${metrics.latency.toFixed(0)}ms <span style="font-size:13px;font-weight:400;color:#64748b">final</span></div>
      ${sparkline(latencyData, '#3b82f6')}
    </div>
  </div>

  <div class="two-col">
    <div class="section">
      <div class="sec-head"><span class="dot" style="background:#3b82f6"></span><h2>Configuración de la prueba</h2></div>
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
    <div class="section">
      <div class="sec-head"><span class="dot" style="background:#10b981"></span><h2>Métricas finales</h2></div>
      <div class="sec-body">
        <table class="kv">
          <tr><td>TPS al finalizar</td><td>${metrics.tps}</td></tr>
          <tr><td>Pico de TPS alcanzado</td><td>${metrics.peakTps}</td></tr>
          <tr><td>Latencia al finalizar</td><td>${metrics.latency.toFixed(1)} ms</td></tr>
          <tr><td>Latencia promedio</td><td>${avgLatency.toFixed(1)} ms</td></tr>
          <tr><td>Uso de CPU estimado</td><td>${metrics.cpuUsage.toFixed(1)}%</td></tr>
          <tr><td>Conexiones activas</td><td>${metrics.connections} / ${store.simulation.connectionLimit}</td></tr>
          <tr><td>Errores último segundo</td><td>${metrics.errorCount}</td></tr>
          <tr><td>Errores totales</td><td>${metrics.totalErrors}</td></tr>
        </table>
      </div>
    </div>
  </div>

  <div class="section analysis" style="margin-bottom:16px">
    <div class="sec-head"><span class="dot" style="background:#8b5cf6"></span><h2>Análisis automático de resultados</h2></div>
    <div class="sec-body"><ul>${analysis.join('')}</ul></div>
  </div>

  <div class="section">
    <div class="sec-head"><span class="dot" style="background:#f59e0b"></span><h2>Muestra de scripts ejecutados (últimos ${Math.min(scriptLogs.length, 20)})</h2></div>
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr><th>Hora</th><th>Tipo</th><th>Estado</th><th>Usuarios</th><th>TPS</th><th>Latencia</th><th>Script ejecutado</th></tr></thead>
        <tbody>${logsHtml}</tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    Generado por <strong>Simulador DB v1.6.0</strong> &nbsp;·&nbsp; ${stamp} &nbsp;·&nbsp; Motor: ${engineCfg.emoji} ${engineCfg.name}
    &nbsp;·&nbsp; <em>Para exportar como PDF: Ctrl+P → Guardar como PDF</em>
  </div>

</div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `reporte-carga-${engine}-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  // ── Stop ────────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setStatus(prev => prev === 'running' ? 'completed' : prev)
  }, [])

  // ── Reset to idle ──────────────────────────────────────────────────────────
  const resetSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    startTimeRef.current = 0
    peakRef.current = 0
    totalErrRef.current = 0
    setStatus('idle')
    setMetrics(EMPTY_METRICS)
    setLatencyData([])
    setTpsData([])
    setCpuData([])
    setConnData([])
    setScriptLogs([])
    setLogFilter('ALL')
    setLogSearch('')
    setLogSort('TIME_DESC')
  }, [])

  // ── Start ───────────────────────────────────────────────────────────────────
  const start = useCallback(() => {
    peakRef.current    = 0
    totalErrRef.current = 0

    setStatus('running')
    setMetrics(EMPTY_METRICS)
    setLatencyData([])
    setTpsData([])
    setCpuData([])
    setConnData([])
    setScriptLogs([])

    startTimeRef.current = Date.now()

    const connLimit    = store.simulation.connectionLimit
    const netLatency   = store.simulation.networkLatency
    const errEnabled   = store.simulation.simulateErrors
    const errProb      = store.simulation.errorProbability / 100

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000

      if (elapsed >= duration) { stop(); return }

      // Virtual users ramp-up curve
      const rampPct      = Math.min(elapsed / Math.max(rampUp, 1), 1)
      const currentUsers = Math.min(Math.floor(rampPct * maxUsers), maxUsers)

      // TPS: each user ~1–3 queries/sec with noise
      const baseQPS = currentUsers * (1 + Math.random() * 2)
      const tps     = Math.max(0, Math.round(baseQPS + (Math.random() - 0.45) * 20))
      peakRef.current = Math.max(peakRef.current, tps)

      // CPU: rises with connection saturation and TPS
      const connRatio = Math.min(currentUsers / Math.max(connLimit, 1), 1)
      const cpuBase   = connRatio * 78 + (tps / 600) * 12
      const cpuUsage  = Math.min(100, Math.max(0, cpuBase + (Math.random() - 0.35) * 8))

      // Active connections: bounded by limit
      const connections = Math.min(currentUsers, connLimit)

      // Latency: spikes when CPU > 70%
      const saturation = Math.max(0, (cpuUsage - 60) / 40)
      const latency    = netLatency + 15 + saturation * 420 + Math.random() * 25

      // Errors
      const errFactor   = errEnabled ? errProb : Math.max(0, (cpuUsage - 82) / 18) * 0.15
      const errorCount  = Math.floor(errFactor * currentUsers * Math.random() * 2.5)
      totalErrRef.current += errorCount

      const scriptsPerTick = Math.max(1, Math.min(4, Math.ceil(tps / 250)))
      const tickLogs = Array.from({ length: scriptsPerTick }, (_, index) => {
        const type = pickQueryType(Math.floor(elapsed * 10) + index)
        const forceError = errEnabled
          ? Math.random() < Math.min(0.5, errProb * 2)
          : cpuUsage >= 92 && Math.random() < 0.25
        return createLogEntry(type, Math.floor(elapsed * 2) + index, currentUsers, tps, latency, forceError)
      })

      const snap: LoadMetrics = {
        currentUsers,
        tps,
        peakTps:        peakRef.current,
        latency,
        cpuUsage,
        connections,
        errorCount,
        elapsedSeconds: elapsed,
        totalErrors:    totalErrRef.current,
      }

      setMetrics(snap)
      setLatencyData(prev => [...prev.slice(-59), latency])
      setTpsData(prev     => [...prev.slice(-59), tps])
      setCpuData(prev     => [...prev.slice(-59), cpuUsage])
      setConnData(prev    => [...prev.slice(-59), connections])
      setScriptLogs(prev  => [...prev.slice(-39), ...tickLogs].slice(-40))
    }, 500)
  }, [duration, maxUsers, rampUp, stop, store.simulation, queryTypes, engineCfg])

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  // ── Derived display values ──────────────────────────────────────────────────
  const progressPct = status === 'completed' ? 100
    : status === 'running' ? Math.min(100, (metrics.elapsedSeconds / duration) * 100)
    : 0
  const timeLeft    = Math.max(0, duration - metrics.elapsedSeconds)
  const isSaturated = metrics.cpuUsage >= 90 || metrics.connections >= store.simulation.connectionLimit * 0.95
  const hasErrors   = metrics.errorCount > 0

  // ── Toggle query type ───────────────────────────────────────────────────────
  function toggleQT(qt: keyof typeof queryTypes) {
    const active = Object.values(queryTypes).filter(Boolean)
    if (active.length === 1 && queryTypes[qt]) return // keep at least one
    setQueryTypes(prev => ({ ...prev, [qt]: !prev[qt] }))
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-surface-900 border border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-surface-800 border-b border-surface-600 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-900/40 shrink-0">
            <Activity size={15} className="text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">Simulador de Carga</span>
              {status === 'running' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/20 text-amber-300 border border-amber-800/30 shrink-0">
                  EN EJECUCIÓN
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
              {status === 'running'   && `Corriendo: ${metrics.elapsedSeconds.toFixed(0)}s de ${duration}s · Usuarios virtuales: ${metrics.currentUsers}/${maxUsers}`}
              {status === 'completed' && `Prueba completada · ${metrics.totalErrors} errores totales · Pico TPS: ${metrics.peakTps}`}
            </div>
          </div>

          <div className="flex-1" />

          {status === 'running' && (
            <button
              onClick={stop}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-800/40 transition-all shrink-0"
            >
              <Square size={11} className="fill-red-400" />
              Detener
            </button>
          )}
          {status === 'completed' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={generateHtmlReport}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-800/40 transition-all"
              >
                <Download size={11} />
                Exportar Reporte
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
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-surface-600 transition-all ml-1 shrink-0"
          >
            <X size={14} />
          </button>
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
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── Config panel (idle / completed) ──────────────────────────────── */}
          {status !== 'running' && (
            <div className="w-60 border-r border-surface-600 flex flex-col shrink-0 overflow-y-auto bg-surface-800/40">
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
                    <span className="text-white font-semibold">{maxUsers}</span>
                  </label>
                  <input type="range" min={10} max={500} step={10} value={maxUsers}
                    onChange={e => setMaxUsers(+e.target.value)}
                    disabled={status !== 'idle'}
                    className={`w-full accent-orange-500 ${status !== 'idle' ? 'opacity-60' : ''}`} />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                    <span>10</span><span>500</span>
                  </div>
                </div>

                {/* Ramp-up */}
                <div>
                  <label className="text-[11px] text-slate-500 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5"><TrendingUp size={10} /> Rampa de usuarios</span>
                    <span className="text-white font-semibold">{rampUp}s</span>
                  </label>
                  <input type="range" min={5} max={120} step={5} value={rampUp}
                    onChange={e => setRampUp(+e.target.value)}
                    disabled={status !== 'idle'}
                    className={`w-full accent-orange-500 ${status !== 'idle' ? 'opacity-60' : ''}`} />
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
                {/* Alert banners */}
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

                {/* Charts grid */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
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
                      max={maxUsers}
                      warningAt={85}
                      criticalAt={100}
                    />
                  </div>

                  {/* Stat badges */}
                  <div className="px-4 py-3 border-t border-surface-600 grid grid-cols-5 gap-2 divide-x divide-surface-700">
                    <StatBadge label="TPS actual"    value={metrics.tps}                        color="text-emerald-400" />
                    <StatBadge label="Pico TPS"      value={metrics.peakTps}                    color="text-blue-400" />
                    <StatBadge label="Latencia"      value={`${metrics.latency.toFixed(0)}ms`}  color="text-white" />
                    <StatBadge label="Errores/seg"   value={metrics.errorCount}                 color={metrics.errorCount > 0 ? 'text-red-400' : 'text-slate-600'} />
                    <StatBadge label="Tiempo rest."  value={`${timeLeft.toFixed(0)}s`}          color="text-amber-400" />
                  </div>
                </div>

                <div className="bg-surface-800 rounded-xl border border-surface-600 overflow-hidden shrink-0">
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-surface-600 bg-surface-800/80">
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-orange-400" />
                      <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                        Logs de scripts ejecutados
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
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

          {/* ── Mini config sidebar (while running) ───────────────────────────── */}
          {status === 'running' && (
            <div className="w-44 border-l border-surface-600 flex flex-col shrink-0 bg-surface-800/30">
              <div className="p-3 flex flex-col gap-3 flex-1">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Config activa</p>
                <div className="space-y-2 text-[11px]">
                  {[
                    ['Motor',    `${engineCfg.emoji} ${engineCfg.name}`],
                    ['Usuarios', maxUsers],
                    ['Duración', `${duration}s`],
                    ['Rampa',    `${rampUp}s`],
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
                  <span className="text-amber-400 font-medium">{progressPct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="text-right text-[10px] text-slate-600 mt-1">
                  {metrics.elapsedSeconds.toFixed(0)}s / {duration}s
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
