import { useState } from 'react'
import { X, Clock, Copy, Check, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'

const ENGINE_COLORS: Record<string, string> = {
  sqlserver: '#0078d4', mysql: '#f29111', postgresql: '#336791',
  sqlite: '#44b0ff', oracle: '#c74634', mongodb: '#47a248', redis: '#dc382d',
}
const ENGINE_LABELS: Record<string, string> = {
  sqlserver: 'SQL Server', mysql: 'MySQL', postgresql: 'PostgreSQL',
  sqlite: 'SQLite', oracle: 'Oracle', mongodb: 'MongoDB', redis: 'Redis',
}

interface Props { onClose: () => void }

export default function HistoryModal({ onClose }: Props) {
  const { history, clearHistory } = useStore()
  const [copied, setCopied] = useState<string | null>(null)

  const sorted = [...history].reverse()

  function copyQuery(id: string, query: string) {
    navigator.clipboard.writeText(query).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  function handleClear() {
    if (!confirm('¿Limpiar todo el historial de consultas?')) return
    clearHistory()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[600px] max-h-[80vh] bg-surface-800 border border-surface-500 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-600 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
              <Clock size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Historial de consultas</h2>
              <p className="text-[10px] text-slate-400">
                {history.length} consulta{history.length !== 1 ? 's' : ''} registrada{history.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg border border-transparent hover:border-red-800/40 transition-all"
              >
                <Trash2 size={11} /> Limpiar todo
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-600 text-slate-400 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-500">
              <Clock size={28} className="mb-3 opacity-30" />
              <p className="text-sm">No hay consultas en el historial</p>
              <p className="text-xs mt-1 opacity-60">Ejecuta una consulta para que aparezca aquí</p>
            </div>
          ) : sorted.map(h => (
            <div key={h.id} className="group bg-surface-700 rounded-lg border border-surface-600 hover:border-surface-500 transition-all overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-600/50">
                <div
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white shrink-0"
                  style={{ background: ENGINE_COLORS[h.engine] ?? '#6366f1' }}
                >
                  {ENGINE_LABELS[h.engine] ?? h.engine}
                </div>
                <span className="text-[10px] text-slate-500 flex-1">
                  {new Date(h.timestamp).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{h.rowCount} filas</span>
                <span className="text-[10px] text-slate-500 font-mono ml-3">{h.executionTime.toFixed(2)}ms</span>
                <button
                  onClick={() => copyQuery(h.id, h.query)}
                  className="opacity-0 group-hover:opacity-100 ml-1 w-5 h-5 flex items-center justify-center rounded hover:bg-surface-500 text-slate-500 hover:text-slate-200 transition-all"
                  title="Copiar consulta"
                >
                  {copied === h.id
                    ? <Check size={11} className="text-green-400" />
                    : <Copy size={11} />}
                </button>
              </div>
              <div className="px-3 py-2">
                <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap break-all leading-relaxed line-clamp-3">
                  {h.query.trim()}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
