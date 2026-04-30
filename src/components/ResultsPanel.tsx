import { Download, FileJson, FileSpreadsheet, Terminal } from 'lucide-react'
import { useStore, getActiveTab } from '../store/useStore'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

export default function ResultsPanel() {
  const store = useStore()
  const tab = getActiveTab(store)
  const results = tab?.results
  const messages = tab?.messages ?? []

  function exportCSV() {
    if (!results) return
    const header = results.columns.join(',')
    const rows = results.rows.map(r => results.columns.map(c => {
      const v = String(r[c] ?? '')
      return v.includes(',') ? `"${v}"` : v
    }).join(','))
    const csv = [header, ...rows].join('\n')
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'resultados.csv')
  }

  function exportJSON() {
    if (!results) return
    saveAs(new Blob([JSON.stringify(results.rows, null, 2)], { type: 'application/json' }), 'resultados.json')
  }

  function exportExcel() {
    if (!results) return
    const ws = XLSX.utils.json_to_sheet(results.rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados')
    XLSX.writeFile(wb, 'resultados.xlsx')
  }

  const formatValue = (v: unknown): string => {
    if (v === null || v === undefined) return 'NULL'
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2)
    return String(v)
  }

  const isNumeric = (v: unknown) => typeof v === 'number'

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface-900">
      {/* Tabs + meta */}
      <div className="flex items-center justify-between px-4 border-b border-surface-600 bg-surface-800 shrink-0">
        <div className="flex items-center">
          {(['results', 'messages'] as const).map(t => (
            <button
              key={t}
              onClick={() => store.setActiveResultsTab(t)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                store.activeResultsTab === t
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'results' ? 'Resultados' : (
                <span className="flex items-center gap-1.5"><Terminal size={11} />Mensajes</span>
              )}
            </button>
          ))}
        </div>
        {results && (
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Filas: <span className="text-white font-semibold">{results.rowCount}</span></span>
            <span>Tiempo de ejecución: <span className="text-white font-mono">{store.metrics.executionTime}</span></span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {store.activeResultsTab === 'results' ? (
          results && results.rows.length > 0 ? (
            <table className="results-table">
              <thead>
                <tr>
                  {results.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.rows.map((row, i) => (
                  <tr key={i}>
                    {results.columns.map(col => (
                      <td key={col} className={isNumeric(row[col]) ? 'text-right text-blue-300' : ''}>
                        {formatValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm gap-2">
              {store.isExecuting ? (
                <>
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Ejecutando consulta...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">📊</span>
                  <span>Ejecuta una consulta para ver los resultados</span>
                  <span className="text-xs text-slate-600">Ctrl + Enter para ejecutar</span>
                </>
              )}
            </div>
          )
        ) : (
          <div className="p-4 font-mono text-xs space-y-1">
            {messages.length > 0 ? messages.map((m, i) => (
              <div key={i} className={`${m.includes('ERROR') || m.includes('✗') ? 'text-red-400' : m.includes('✓') || m.includes('exitosamente') ? 'text-green-400' : 'text-slate-400'}`}>
                {m}
              </div>
            )) : (
              <div className="text-slate-500">Sin mensajes</div>
            )}
          </div>
        )}
      </div>

      {/* Export bar */}
      {results && results.rows.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-surface-600 bg-surface-800 shrink-0">
          <span className="text-xs text-slate-500 mr-1">Exportar resultados:</span>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-surface-600 hover:bg-surface-500 text-slate-300 hover:text-white rounded border border-surface-500 transition-colors">
            <Download size={11} /> CSV
          </button>
          <button onClick={exportJSON} className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-surface-600 hover:bg-surface-500 text-slate-300 hover:text-white rounded border border-surface-500 transition-colors">
            <FileJson size={11} /> JSON
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-surface-600 hover:bg-surface-500 text-slate-300 hover:text-white rounded border border-surface-500 transition-colors">
            <FileSpreadsheet size={11} /> Excel
          </button>
        </div>
      )}
    </div>
  )
}
