import { useState, useRef, useEffect } from 'react'
import { RefreshCw, ChevronDown, Check } from 'lucide-react'
import { useStore, getActiveTab } from '../store/useStore'
import { ENGINE_CONFIGS } from '../types'
import type { EngineType } from '../types'

function DBDropdown({ onClose }: { onClose: () => void }) {
  const { databases, activeDbName, setActiveDbName } = useStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-52 bg-surface-700 border border-surface-500 rounded-xl shadow-2xl z-30 overflow-hidden">
      <div className="px-3 py-2 border-b border-surface-600">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bases de datos</span>
      </div>
      <div className="py-1 max-h-52 overflow-y-auto">
        {databases.map(db => (
          <button
            key={db.name}
            onClick={() => { setActiveDbName(db.name); onClose() }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
              db.name === activeDbName ? 'bg-blue-600/20 text-white' : 'text-slate-300 hover:bg-surface-600 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: db.color ?? '#6366f1' }} />
            <span className="flex-1 text-left font-medium truncate">{db.name}</span>
            <span className="text-[10px] text-slate-500">{db.tables.length} tablas</span>
            {db.name === activeDbName && <Check size={12} className="text-blue-400 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function EngineDropdown({ onClose }: { onClose: () => void }) {
  const { tabs, addTab } = useStore()
  const ref = useRef<HTMLDivElement>(null)
  const openEngines = new Set(tabs.map(t => t.engine))
  const engines = (['sqlserver', 'mysql', 'postgresql', 'mongodb', 'oracle', 'sqlite', 'redis'] as EngineType[])

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div ref={ref} className="absolute top-full right-0 mt-1 w-48 bg-surface-700 border border-surface-500 rounded-xl shadow-2xl z-30 overflow-hidden">
      <div className="px-3 py-2 border-b border-surface-600">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cambiar motor</span>
      </div>
      <div className="py-1">
        {engines.map(engine => {
          const cfg = ENGINE_CONFIGS[engine]
          const open = openEngines.has(engine)
          return (
            <button
              key={engine}
              onClick={() => { if (!open) addTab(engine); onClose() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-surface-600 transition-colors"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
              <span className="flex-1 text-left">{cfg.name}</span>
              {open && <span className="text-[10px] text-green-400">Abierto</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ConnectionBar() {
  const store = useStore()
  const tab = getActiveTab(store)
  const [showDB, setShowDB] = useState(false)
  const [showEngine, setShowEngine] = useState(false)
  if (!tab) return null

  const cfg = ENGINE_CONFIGS[tab.engine]
  const activeDb = store.databases.find(d => d.name === store.activeDbName)

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-surface-800 border-b border-surface-600 shrink-0">
      {/* Connection */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 shrink-0">Conexión:</span>
        <div className="flex items-center gap-1.5 bg-surface-700 border border-surface-600 rounded-lg px-2.5 py-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
          <span className="text-xs text-slate-200 font-medium">{tab.connection}</span>
          <ChevronDown size={10} className="text-slate-500" />
        </div>
      </div>

      {/* Database selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 shrink-0">Base de datos:</span>
        <div className="relative">
          <button
            onClick={() => { setShowDB(o => !o); setShowEngine(false) }}
            className="flex items-center gap-1.5 bg-surface-700 border border-surface-600 hover:border-blue-500/50 rounded-lg px-2.5 py-1 transition-colors group"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: activeDb?.color ?? '#6366f1' }}
            />
            <span className="text-xs text-white font-semibold">{store.activeDbName}</span>
            <ChevronDown size={10} className={`text-slate-400 transition-transform ${showDB ? 'rotate-180' : ''}`} />
          </button>
          {showDB && <DBDropdown onClose={() => setShowDB(false)} />}
        </div>
      </div>

      {/* Autocommit */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Autocommit:</span>
        <label className="toggle">
          <input type="checkbox" checked={store.autocommit} onChange={store.toggleAutocommit} />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* DB stats */}
      {activeDb && (
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span><span className="text-slate-300 font-medium">{activeDb.tables.length}</span> tablas</span>
        </div>
      )}

      <div className="flex-1" />

      {/* Change engine */}
      <div className="relative">
        <button
          onClick={() => { setShowEngine(o => !o); setShowDB(false) }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw size={12} />
          Cambiar Motor
        </button>
        {showEngine && <EngineDropdown onClose={() => setShowEngine(false)} />}
      </div>
    </div>
  )
}
