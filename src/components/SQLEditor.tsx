import { useEffect, useRef } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import { Maximize2 } from 'lucide-react'
import { useStore, getActiveTab } from '../store/useStore'
import { executeSQL, executeMongoQuery, executeRedisCommand, initializeDatabase } from '../engines/sqlEngine'

loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } })

export default function SQLEditor() {
  const store = useStore()
  const tab = getActiveTab(store)
  const editorRef = useRef<unknown>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        runQuery()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  async function runQuery() {
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
      store.setTabMessages(tab.id, [
        `[${new Date().toLocaleTimeString()}] Consulta ejecutada exitosamente`,
        `Filas devueltas: ${result.rowCount}`,
        `Tiempo: ${result.executionTime.toFixed(3)} ms`,
        `Memoria: ${result.memoryUsage.toFixed(2)} MB`,
        `Motor: ${tab.engine.toUpperCase()}`,
        `Base de datos: ${tab.database}`,
      ])
      const elapsed = performance.now() - t0
      const mm = Math.floor(elapsed / 60000).toString().padStart(2, '0')
      const ss = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0')
      const ms = Math.floor(elapsed % 1000).toString().padStart(3, '0')
      store.setMetrics({ executionTime: `00:${mm}:${ss}.${ms}`, rowsAffected: result.rowCount, warnings: result.warnings, memoryUsage: `${result.memoryUsage.toFixed(2)} MB` })
      store.addHistory({ id: Date.now().toString(), query: tab.query, timestamp: new Date(), engine: tab.engine, rowCount: result.rowCount, executionTime: result.executionTime })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      store.setTabMessages(tab.id, [`[${new Date().toLocaleTimeString()}] ✗ ERROR: ${msg}`])
      store.setActiveResultsTab('messages')
    } finally {
      store.setIsExecuting(false)
    }
  }

  const language = tab?.engine === 'mongodb' ? 'javascript' : tab?.engine === 'redis' ? 'plaintext' : 'sql'

  return (
    <div className="flex flex-col border-b border-surface-600 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-700 border-b border-surface-600">
        <span className="text-xs font-semibold text-slate-300">
          Editor de Consultas
          {tab?.engine === 'mongodb' && ' (MongoDB)'}
          {tab?.engine === 'redis' && ' (Redis)'}
          {!['mongodb','redis'].includes(tab?.engine ?? '') && ' (SQL)'}
        </span>
        <div className="flex items-center gap-2">
          {store.isExecuting && (
            <span className="flex items-center gap-1.5 text-xs text-yellow-400">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Ejecutando...
            </span>
          )}
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-600 text-slate-400 hover:text-white transition-colors">
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          theme={store.editorTheme}
          value={tab?.query ?? ''}
          onChange={value => { if (tab) store.updateQuery(tab.id, value ?? '') }}
          onMount={editor => { editorRef.current = editor }}
          options={{
            minimap: { enabled: false },
            fontSize: store.editorFontSize,
            lineHeight: store.editorFontSize * 1.6,
            fontFamily: `'${store.editorFontFamily}', 'Fira Code', Consolas, monospace`,
            lineNumbers: store.editorLineNumbers ? 'on' : 'off',
            scrollBeyondLastLine: false,
            wordWrap: store.editorWordWrap ? 'on' : 'off',
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 8, bottom: 8 },
            scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
      </div>
    </div>
  )
}
