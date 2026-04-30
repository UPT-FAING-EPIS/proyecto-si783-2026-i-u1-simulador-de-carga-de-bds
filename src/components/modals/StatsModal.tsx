import { X, BarChart3, Clock, Database, Hash, TrendingUp, Zap } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getAllTableInfos } from '../../engines/sqlEngine'

const ENGINE_COLORS: Record<string, string> = {
  sqlserver: '#0078d4', mysql: '#f29111', postgresql: '#336791',
  sqlite: '#44b0ff', oracle: '#c74634', mongodb: '#47a248', redis: '#dc382d',
}
const ENGINE_LABELS: Record<string, string> = {
  sqlserver: 'SQL Server', mysql: 'MySQL', postgresql: 'PostgreSQL',
  sqlite: 'SQLite', oracle: 'Oracle', mongodb: 'MongoDB', redis: 'Redis',
}

interface Props { onClose: () => void }

export default function StatsModal({ onClose }: Props) {
  const { history } = useStore()
  const allTables = getAllTableInfos()

  const totalQueries = history.length
  const avgTime = totalQueries > 0
    ? (history.reduce((a, h) => a + h.executionTime, 0) / totalQueries).toFixed(2)
    : '0.00'
  const totalRows = history.reduce((a, h) => a + h.rowCount, 0)

  const engineStats = Object.entries(
    history.reduce((acc, h) => {
      if (!acc[h.engine]) acc[h.engine] = { count: 0, totalTime: 0, totalRows: 0 }
      acc[h.engine].count++
      acc[h.engine].totalTime += h.executionTime
      acc[h.engine].totalRows += h.rowCount
      return acc
    }, {} as Record<string, { count: number; totalTime: number; totalRows: number }>)
  ).sort((a, b) => b[1].count - a[1].count)

  const maxCount = engineStats.length > 0 ? Math.max(...engineStats.map(([, v]) => v.count)) : 1
  const recent = [...history].reverse().slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[520px] bg-surface-800 border border-surface-500 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-600">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center">
              <BarChart3 size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Estadísticas</h2>
              <p className="text-[10px] text-slate-400">Resumen de actividad de la sesión</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-600 text-slate-400 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: <Zap size={13} />,       label: 'Consultas',    value: totalQueries,       color: 'text-blue-400' },
              { icon: <Clock size={13} />,      label: 'Tiempo medio', value: `${avgTime}ms`,     color: 'text-green-400' },
              { icon: <TrendingUp size={13} />, label: 'Filas totales',value: totalRows,           color: 'text-yellow-400' },
              { icon: <Database size={13} />,   label: 'Tablas',       value: allTables.length,   color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="bg-surface-700 rounded-lg p-3 text-center border border-surface-600">
                <span className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</span>
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          {engineStats.length > 0 ? (
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Hash size={11} /> Uso por motor
              </div>
              <div className="space-y-2">
                {engineStats.map(([eng, stat]) => (
                  <div key={eng} className="flex items-center gap-3">
                    <div className="w-[84px] text-[11px] text-slate-300 truncate">{ENGINE_LABELS[eng] ?? eng}</div>
                    <div className="flex-1 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(stat.count / maxCount) * 100}%`, background: ENGINE_COLORS[eng] ?? '#6366f1' }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 w-28 text-right font-mono">
                      {stat.count} consulta{stat.count !== 1 ? 's' : ''} · {(stat.totalTime / stat.count).toFixed(1)}ms
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-surface-700 rounded-lg p-6 text-center border border-surface-600">
              <BarChart3 size={24} className="text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Ejecuta consultas para ver estadísticas</p>
            </div>
          )}

          {recent.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Clock size={11} /> Últimas consultas
              </div>
              <div className="space-y-1.5">
                {recent.map(h => (
                  <div key={h.id} className="flex items-center gap-2 bg-surface-700 rounded-lg px-3 py-2 border border-surface-600">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ENGINE_COLORS[h.engine] ?? '#6366f1' }} />
                    <span className="text-[11px] text-slate-300 font-mono truncate flex-1">{h.query.replace(/\s+/g, ' ').trim()}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{h.executionTime.toFixed(1)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
