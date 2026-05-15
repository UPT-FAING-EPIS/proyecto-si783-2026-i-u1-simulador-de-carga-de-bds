import { useRef, useEffect } from 'react'
import { BarChart3, Clock, Trash2, Info } from 'lucide-react'
import { useStore } from '../../store/useStore'

type SubModal = 'stats' | 'history' | 'about'

interface Props {
  onClose: () => void
  onOpenModal: (m: SubModal) => void
  session?: { username: string; role: string; color: string }
}

export default function UserDropdown({ onClose, onOpenModal, session }: Props) {
  const { history, clearHistory } = useStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const totalQueries = history.length
  const avgTime = history.length > 0
    ? (history.reduce((a, h) => a + h.executionTime, 0) / history.length).toFixed(1)
    : '0'

  const initials = session?.username
    ? session.username.slice(0, 2).toUpperCase()
    : 'SA'

  function open(m: SubModal) {
    onClose()
    setTimeout(() => onOpenModal(m), 80)
  }

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 w-[220px] bg-surface-700 border border-surface-500 rounded-xl shadow-2xl z-50 overflow-hidden">
      {/* Profile header */}
      <div className="px-4 py-3.5 bg-surface-600 border-b border-surface-500">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: session?.color ?? '#3b82f6' }}
          >
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-white truncate">{session?.username ?? 'Usuario'}</div>
            <div className="text-[10px] text-slate-400 truncate">{session?.role ?? 'Demo'} · v1.6.0</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-surface-600 border-b border-surface-600">
        <div className="flex flex-col items-center py-2.5">
          <span className="text-base font-bold text-white">{totalQueries}</span>
          <span className="text-[10px] text-slate-500">Consultas</span>
        </div>
        <div className="flex flex-col items-center py-2.5">
          <span className="text-base font-bold text-white">
            {avgTime}<span className="text-xs font-normal text-slate-400">ms</span>
          </span>
          <span className="text-[10px] text-slate-500">Tiempo medio</span>
        </div>
      </div>

      {/* Actions */}
      <div className="py-1">
        <button
          onClick={() => open('stats')}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-600 transition-colors"
        >
          <BarChart3 size={14} className="text-blue-400" />
          Estadísticas
        </button>
        <button
          onClick={() => open('history')}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-600 transition-colors"
        >
          <Clock size={14} className="text-green-400" />
          Historial completo
          {totalQueries > 0 && (
            <span className="ml-auto text-[10px] bg-surface-500 text-slate-300 px-1.5 py-0.5 rounded-full">{totalQueries}</span>
          )}
        </button>
        <button
          onClick={() => { clearHistory(); onClose() }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-red-300 hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={14} className="text-red-400" />
          Limpiar historial
        </button>
      </div>

      <div className="border-t border-surface-600 py-1">
        <button
          onClick={() => open('about')}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-surface-600 transition-colors"
        >
          <Info size={14} />
          Acerca del simulador
        </button>
      </div>
    </div>
  )
}
