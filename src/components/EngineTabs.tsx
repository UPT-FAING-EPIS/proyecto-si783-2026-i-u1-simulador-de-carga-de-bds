import { X, Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { ENGINE_CONFIGS } from '../types'
import type { EngineType } from '../types'

const ENGINE_ORDER: EngineType[] = ['sqlserver', 'mysql', 'postgresql', 'mongodb', 'oracle', 'sqlite', 'redis']

const ENGINE_ICONS: Record<EngineType, string> = {
  sqlserver:  '🔴',
  mysql:      '🐬',
  postgresql: '🐘',
  mongodb:    '🍃',
  oracle:     '🔶',
  sqlite:     '💎',
  redis:      '⚡',
}

export default function EngineTabs() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useStore()
  const openEngines = new Set(tabs.map(t => t.engine))

  return (
    <div className="flex items-center border-b border-surface-600 bg-surface-800 shrink-0 overflow-x-auto">
      {tabs.map(tab => {
        const cfg = ENGINE_CONFIGS[tab.engine]
        const active = tab.id === activeTabId
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-r border-surface-600 transition-colors whitespace-nowrap group shrink-0 ${
              active
                ? 'bg-surface-700 text-white border-t-2'
                : 'bg-surface-800 text-slate-400 hover:text-slate-200 hover:bg-surface-700'
            }`}
            style={active ? { borderTopColor: cfg.color } : {}}
          >
            <span className="text-base leading-none">{ENGINE_ICONS[tab.engine]}</span>
            <span>{cfg.name}</span>
            {tabs.length > 1 && (
              <span
                role="button"
                onClick={e => { e.stopPropagation(); removeTab(tab.id) }}
                className="ml-1 w-4 h-4 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-surface-500 text-slate-400 hover:text-white transition-all"
              >
                <X size={10} />
              </span>
            )}
          </button>
        )
      })}

      {/* Add tab dropdown */}
      <div className="relative group px-2">
        <button className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-surface-600 transition-colors">
          <Plus size={16} />
        </button>
        <div className="absolute top-full left-0 mt-1 w-44 bg-surface-700 border border-surface-500 rounded-lg shadow-xl z-20 hidden group-hover:block">
          {ENGINE_ORDER.filter(e => !openEngines.has(e)).map(engine => (
            <button
              key={engine}
              onClick={() => addTab(engine)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-surface-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <span>{ENGINE_ICONS[engine]}</span>
              {ENGINE_CONFIGS[engine].name}
            </button>
          ))}
          {ENGINE_ORDER.every(e => openEngines.has(e)) && (
            <div className="px-3 py-2 text-xs text-slate-500">Todos los motores abiertos</div>
          )}
        </div>
      </div>
    </div>
  )
}
