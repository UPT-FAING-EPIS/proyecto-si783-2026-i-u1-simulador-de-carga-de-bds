import { useState } from 'react'
import {
  Play, Square, Eraser, Save, ChevronLeft, ChevronRight,
  Clock, Code2, Activity, Zap, BarChart2, Settings2,
  ChevronDown, Database, Cpu, Wifi, AlertTriangle, MemoryStick,
  Timer,
} from 'lucide-react'
import { useStore, getActiveTab } from '../store/useStore'
import { ENGINE_CONFIGS } from '../types'
import { executeSQL, executeMongoQuery, executeRedisCommand, initializeDatabase } from '../engines/sqlEngine'

// ─── Snippets ─────────────────────────────────────────────────────────────────

const SNIPPETS: Record<string, string> = {
  'SELECT Básico':  'SELECT *\nFROM tabla\nWHERE condición;',
  'INSERT':         "INSERT INTO tabla (col1, col2)\nVALUES ('valor1', 'valor2');",
  'UPDATE':         "UPDATE tabla\nSET columna = 'nuevo_valor'\nWHERE condición;",
  'DELETE':         'DELETE FROM tabla\nWHERE condición;',
  'INNER JOIN':     'SELECT a.col, b.col\nFROM tablaA a\nINNER JOIN tablaB b ON a.id = b.id;',
  'GROUP BY':       'SELECT columna, COUNT(*) AS total\nFROM tabla\nGROUP BY columna\nHAVING total > 1;',
  'CREATE TABLE':   'CREATE TABLE nueva_tabla (\n  id INT PRIMARY KEY,\n  nombre VARCHAR(100)\n);',
  'LEFT JOIN':      'SELECT a.col, b.col\nFROM tablaA a\nLEFT JOIN tablaB b ON a.id = b.id;',
}

function timeAgo(date: Date): string {
  const d = Math.floor((Date.now() - date.getTime()) / 1000)
  if (d < 60) return `${d}s`
  if (d < 3600) return `${Math.floor(d / 60)} min`
  return `${Math.floor(d / 3600)}h`
}

// ─── Accordion section ────────────────────────────────────────────────────────

interface SectionProps {
  id: string
  icon: React.ReactNode
  label: string
  iconColor?: string
  accentRgb?: string          // e.g. "74 222 128" for green-400
  badge?: string | number
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({
  id, icon, label, iconColor = 'text-slate-400',
  accentRgb = '100 116 139',  // slate-500 default
  badge, defaultOpen = true, children,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [hovered, setHovered] = useState(false)

  return (
    <div className="border-b border-surface-700/60 last:border-0 relative overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        id={`section-${id}`}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-all duration-300 group relative"
        style={{
          background: hovered
            ? `linear-gradient(90deg, rgba(${accentRgb},0.12) 0%, rgba(${accentRgb},0.04) 60%, transparent 100%)`
            : 'transparent',
        }}
      >
        {/* Colored left accent bar */}
        <span
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r transition-all duration-300"
          style={{
            background: `rgb(${accentRgb})`,
            opacity: hovered ? (open ? 1 : 0.7) : 0,
            transform: hovered ? 'scaleY(1)' : 'scaleY(0)',
          }}
        />

        {/* Icon with glow */}
        <span
          className={`${iconColor} shrink-0 transition-all duration-300`}
          style={{
            filter: hovered ? `drop-shadow(0 0 6px rgba(${accentRgb},0.8))` : 'none',
            transform: hovered ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          {icon}
        </span>

        {/* Label */}
        <span
          className="flex-1 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors duration-300"
          style={{ color: hovered ? `rgb(${accentRgb})` : '#94a3b8' }}
        >
          {label}
        </span>

        {/* Badge */}
        {badge !== undefined && (
          <span
            className="text-[10px] rounded px-1.5 py-0.5 font-mono mr-1 transition-all duration-300"
            style={{
              background: hovered ? `rgba(${accentRgb},0.2)` : 'rgba(51,65,85,0.8)',
              color: hovered ? `rgb(${accentRgb})` : '#64748b',
              border: `1px solid ${hovered ? `rgba(${accentRgb},0.4)` : 'transparent'}`,
            }}
          >
            {badge}
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          size={12}
          className="shrink-0 transition-all duration-300"
          style={{
            color: hovered ? `rgba(${accentRgb},0.8)` : '#64748b',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        />
      </button>

      {/* Content */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? 600 : 0, opacity: open ? 1 : 0 }}
      >
        <div className="pb-2">{children}</div>
      </div>
    </div>
  )
}

// ─── Row util ─────────────────────────────────────────────────────────────────

function Row({ label, value, valueClass = '' }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-[11px] font-medium ${valueClass || 'text-slate-300'}`}>{value}</span>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const store = useStore()
  const tab = getActiveTab(store)
  const cfg = tab ? ENGINE_CONFIGS[tab.engine] : ENGINE_CONFIGS.sqlserver
  const [snippetKey, setSnippetKey] = useState('SELECT Básico')

  async function handleExecute() {
    if (!tab || store.isExecuting) return
    initializeDatabase()
    store.setIsExecuting(true)
    store.setActiveResultsTab('results')
    const t0 = performance.now()
    try {
      const result = tab.engine === 'mongodb'
        ? executeMongoQuery(tab.query)
        : tab.engine === 'redis'
          ? executeRedisCommand(tab.query)
          : await executeSQL(tab.query, store.simulation.networkLatency, store.simulation.simulateErrors, store.simulation.errorProbability)
      store.setTabResults(tab.id, result)
      store.setTabMessages(tab.id, [`✓ Consulta ejecutada — ${result.rowCount} filas — ${result.executionTime.toFixed(1)}ms`])
      const elapsed = performance.now() - t0
      const mm = Math.floor(elapsed / 60000).toString().padStart(2, '0')
      const ss = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0')
      const ms = Math.floor(elapsed % 1000).toString().padStart(3, '0')
      store.setMetrics({ executionTime: `00:${mm}:${ss}.${ms}`, rowsAffected: result.rowCount, warnings: result.warnings, memoryUsage: `${result.memoryUsage.toFixed(2)} MB` })
      store.addHistory({ id: Date.now().toString(), query: tab.query, timestamp: new Date(), engine: tab.engine, rowCount: result.rowCount, executionTime: result.executionTime })
      if (/^\s*(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE)\s/i.test(tab.query)) store.incrementDbVersion()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error'
      store.setTabMessages(tab.id, [`✗ ERROR: ${msg}`])
      store.setActiveResultsTab('messages')
    } finally {
      store.setIsExecuting(false)
    }
  }

  if (store.sidebarCollapsed) {
    return (
      <aside className="w-10 bg-surface-800 border-r border-surface-600 flex flex-col items-center py-3 gap-3">
        <button onClick={store.toggleSidebar} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-surface-600 transition-colors">
          <ChevronRight size={16} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-full bg-surface-800 border-r border-surface-600 flex flex-col overflow-hidden">

      {/* ── Top header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-surface-600 shrink-0">
        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
          <Cpu size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white">Panel de Control</div>
          <div className="text-[10px] text-slate-500 truncate">{cfg.name} · {store.activeDbName}</div>
        </div>
        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
      </div>

      {/* ── Scrollable sections ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── 1. Estado del Sistema ─────────────────────────────────── */}
        <Section id="status" icon={<Activity size={13} />} label="Estado del Sistema" iconColor="text-green-400" accentRgb="74 222 128">
          <div className="mx-3 bg-surface-700/60 rounded-lg border border-surface-600/60 overflow-hidden">
            <Row label="Motor activo" value={<span style={{ color: cfg.color }}>{cfg.name}</span>} />
            <div className="border-t border-surface-600/40" />
            <Row label="Base de datos" value={store.activeDbName} />
            <div className="border-t border-surface-600/40" />
            <Row
              label="Estado"
              value={
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]" />
                  <span className="text-green-400">Conectado</span>
                </span>
              }
            />
            <div className="border-t border-surface-600/40" />
            <Row label="Latencia" value={
              <span className="flex items-center gap-1">
                <Wifi size={10} className="text-blue-400" />
                {store.simulation.networkLatency} ms
              </span>
            } />
            <div className="border-t border-surface-600/40" />
            <Row label="Aislamiento" value={
              <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                {store.simulation.isolationLevel.replace(' ', ' ')}
              </span>
            } />
          </div>
        </Section>

        {/* ── 2. Acciones Rápidas ───────────────────────────────────── */}
        <Section id="actions" icon={<Zap size={13} />} label="Acciones Rápidas" iconColor="text-yellow-400" accentRgb="250 204 21">
          <div className="mx-3 grid grid-cols-2 gap-1.5">
            {([
              { icon: <Play size={12} />,   label: 'Ejecutar',  color: 'text-green-400',  bg: 'hover:bg-green-500/10 hover:border-green-500/40', action: handleExecute },
              { icon: <Square size={12} />, label: 'Detener',   color: 'text-red-400',    bg: 'hover:bg-red-500/10 hover:border-red-500/40',     action: () => store.setIsExecuting(false) },
              { icon: <Eraser size={12} />, label: 'Limpiar',   color: 'text-yellow-400', bg: 'hover:bg-yellow-500/10 hover:border-yellow-500/40', action: () => { if (tab) { store.updateQuery(tab.id, ''); store.setTabResults(tab.id, null) } } },
              { icon: <Save size={12} />,   label: 'Guardar',   color: 'text-blue-400',   bg: 'hover:bg-blue-500/10 hover:border-blue-500/40',   action: () => {} },
            ] as const).map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                className={`flex flex-col items-center gap-1.5 px-2 py-2.5 bg-surface-700/60 rounded-lg text-slate-300 hover:text-white text-[11px] font-medium transition-all border border-surface-600/60 ${btn.bg}`}
              >
                <span className={btn.color}>{btn.icon}</span>
                {btn.label}
              </button>
            ))}
          </div>
        </Section>

        {/* ── 3. Simulación ────────────────────────────────────────── */}
        <Section id="sim" icon={<Settings2 size={13} />} label="Simulación" iconColor="text-indigo-400" accentRgb="129 140 248" defaultOpen={false}>
          <div className="mx-3 bg-surface-700/60 rounded-lg border border-surface-600/60 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5"><Wifi size={10} />Latencia (ms)</span>
              <input
                type="number" min="0" max="5000"
                value={store.simulation.networkLatency}
                onChange={e => store.setSimulation({ networkLatency: +e.target.value })}
                className="w-16 text-right text-[11px] bg-surface-600 border border-surface-500 rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="border-t border-surface-600/40" />
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-slate-500">Límite conexiones</span>
              <input
                type="number" min="1" max="500"
                value={store.simulation.connectionLimit}
                onChange={e => store.setSimulation({ connectionLimit: +e.target.value })}
                className="w-16 text-right text-[11px] bg-surface-600 border border-surface-500 rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="border-t border-surface-600/40" />
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5"><AlertTriangle size={10} />Simular errores</span>
              <label className="toggle">
                <input type="checkbox" checked={store.simulation.simulateErrors}
                  onChange={e => store.setSimulation({ simulateErrors: e.target.checked })} />
                <span className="toggle-slider" />
              </label>
            </div>
            {store.simulation.simulateErrors && (
              <>
                <div className="border-t border-surface-600/40" />
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[11px] text-slate-500">Prob. error (%)</span>
                  <input
                    type="number" min="0" max="100"
                    value={store.simulation.errorProbability}
                    onChange={e => store.setSimulation({ errorProbability: +e.target.value })}
                    className="w-16 text-right text-[11px] bg-surface-600 border border-surface-500 rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}
            <div className="border-t border-surface-600/40" />
            <div className="px-3 py-2">
              <span className="text-[11px] text-slate-500 block mb-1.5">Tipo de aislamiento</span>
              <select
                className="w-full text-[11px] bg-surface-600 border border-surface-500 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
                value={store.simulation.isolationLevel}
                onChange={e => store.setSimulation({ isolationLevel: e.target.value as any })}
              >
                {['READ UNCOMMITTED','READ COMMITTED','REPEATABLE READ','SERIALIZABLE'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* ── 4. Métricas ──────────────────────────────────────────── */}
        <Section id="metrics" icon={<BarChart2 size={13} />} label="Métricas" iconColor="text-blue-400" accentRgb="96 165 250">
          <div className="mx-3 grid grid-cols-2 gap-1.5">
            {([
              { icon: <Timer size={11} />,        color: 'text-blue-400',   label: 'Tiempo',   value: store.metrics.executionTime },
              { icon: <Database size={11} />,     color: 'text-green-400',  label: 'Filas',    value: store.metrics.rowsAffected },
              { icon: <AlertTriangle size={11} />,color: 'text-yellow-400', label: 'Warnings', value: store.metrics.warnings },
              { icon: <MemoryStick size={11} />,  color: 'text-purple-400', label: 'Memoria',  value: store.metrics.memoryUsage },
            ] as const).map(m => (
              <div key={m.label} className="bg-surface-700/60 border border-surface-600/60 rounded-lg px-2.5 py-2">
                <div className={`flex items-center gap-1 ${m.color} mb-1`}>
                  {m.icon}
                  <span className="text-[10px] text-slate-500">{m.label}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-200 truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 5. Snippets SQL ──────────────────────────────────────── */}
        <Section id="snippets" icon={<Code2 size={13} />} label="Snippets SQL" iconColor="text-orange-400" accentRgb="251 146 60" defaultOpen={false}
          badge={Object.keys(SNIPPETS).length}>
          <div className="mx-3">
            <div className="grid grid-cols-2 gap-1 mb-2">
              {Object.keys(SNIPPETS).map(k => (
                <button
                  key={k}
                  onClick={() => setSnippetKey(k)}
                  className={`text-[10px] px-2 py-1.5 rounded text-left truncate transition-colors border ${
                    snippetKey === k
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                      : 'bg-surface-700/60 border-surface-600/60 text-slate-400 hover:text-white hover:bg-surface-600/60'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="bg-surface-900/80 border border-surface-600/60 rounded-lg p-2.5 font-mono text-[10px] text-slate-300 whitespace-pre leading-relaxed mb-2 max-h-[80px] overflow-auto">
              {SNIPPETS[snippetKey]}
            </div>
            <button
              onClick={() => {
                if (tab) store.updateQuery(tab.id, (tab.query ? tab.query + '\n\n' : '') + SNIPPETS[snippetKey])
              }}
              className="w-full py-1.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Insertar en editor
            </button>
          </div>
        </Section>

        {/* ── 6. Historial ─────────────────────────────────────────── */}
        <Section id="history" icon={<Clock size={13} />} label="Historial" iconColor="text-slate-400" accentRgb="148 163 184"
          badge={store.history.length} defaultOpen={false}>
          <div className="mx-3 space-y-1">
            {store.history.length === 0 ? (
              <div className="text-[11px] text-slate-500 text-center py-4">Sin historial</div>
            ) : (
              <>
                {store.history.slice(0, 6).map(h => (
                  <button
                    key={h.id}
                    onClick={() => { if (tab) store.updateQuery(tab.id, h.query) }}
                    className="w-full text-left px-2.5 py-2 bg-surface-700/60 hover:bg-surface-600/60 rounded-lg border border-surface-600/60 hover:border-surface-500/60 transition-all group"
                  >
                    <div className="text-[11px] text-slate-300 group-hover:text-white truncate">
                      {h.query.split('\n')[0].substring(0, 35)}{h.query.length > 35 ? '…' : ''}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-slate-500">{timeAgo(h.timestamp)} atrás</span>
                      <span className="text-[10px] text-slate-500">{h.rowCount} filas</span>
                    </div>
                  </button>
                ))}
                <button onClick={store.clearHistory} className="w-full text-[10px] text-slate-500 hover:text-red-400 py-1 transition-colors">
                  Limpiar historial
                </button>
              </>
            )}
          </div>
        </Section>

      </div>

      {/* ── Collapse button ──────────────────────────────────────────── */}
      <button
        onClick={store.toggleSidebar}
        className="flex items-center justify-center gap-2 h-9 border-t border-surface-600 text-[11px] text-slate-500 hover:text-white hover:bg-surface-700 transition-colors shrink-0"
      >
        <ChevronLeft size={13} />
        Colapsar panel
      </button>
    </aside>
  )
}
