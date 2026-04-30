import { useState, useRef, useCallback, useEffect } from 'react'
import {
  X, Upload, Table2, Trash2, Eye, FileText, FileJson, Code2,
  RefreshCw, Plus, AlertTriangle, CheckCircle2, Database,
  ChevronDown, ChevronRight, Info,
} from 'lucide-react'
import {
  importTableFromCSV, importTableFromJSON, importTableFromSQL,
  getAllTableInfos, dropTable, getTablePreview,
  preprocessSQL, type TableInfo, type SQLImportResult,
} from '../engines/sqlEngine'
import { useStore } from '../store/useStore'

type Tab = 'import' | 'tables' | 'preview'

interface Props { onClose: () => void }

const DB_COLORS = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4']

export default function DatabaseManagerModal({ onClose }: Props) {
  const store = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('import')
  const [importMode, setImportMode] = useState<'csv' | 'json' | 'sql'>('sql')
  const [tableName, setTableName] = useState('')
  const [content, setContent] = useState('')
  const [tables, setTables] = useState<TableInfo[]>([])
  const [previewTable, setPreviewTable] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<{ columns: string[]; rows: Record<string, unknown>[] } | null>(null)
  const [result, setResult] = useState<SQLImportResult | null>(null)
  const [simpleError, setSimpleError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPreprocessed, setShowPreprocessed] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(() => setTables(getAllTableInfos()), [])
  useEffect(() => { refresh() }, [refresh])

  // Detect DB name for preview
  const detectedDb = importMode === 'sql' && content
    ? preprocessSQL(content).dbName
    : null

  function handleModeChange(mode: 'csv' | 'json' | 'sql') {
    setImportMode(mode)
    setResult(null)
    setSimpleError(null)
    setContent('')
    if (mode !== 'sql') setTableName('')
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'sql') setImportMode('sql')
    else if (ext === 'json') setImportMode('json')
    else setImportMode('csv')
    const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_')
    if (ext !== 'sql') setTableName(tableName || base)
    const reader = new FileReader()
    reader.onload = ev => setContent(String(ev.target?.result ?? ''))
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  async function handleImport() {
    setResult(null); setSimpleError(null); setLoading(true)
    try {
      if (importMode === 'csv') {
        if (!tableName.trim()) throw new Error('Escribe un nombre para la tabla')
        importTableFromCSV(tableName.trim(), content)
        // Register as a simple DB entry
        const tbl = tableName.trim()
        store.registerDatabase(
          store.activeDbName,
          [...(store.databases.find(d => d.name === store.activeDbName)?.tables ?? []), tbl]
        )
        setSimpleError(null)
        setResult({ tablesCreated: [tbl], tablesReferenced: [tbl], rowsInserted: getAllTableInfos().find(t => t.name === tbl)?.rowCount ?? 0, errors: [], dbName: store.activeDbName, warnings: [] })
      } else if (importMode === 'json') {
        if (!tableName.trim()) throw new Error('Escribe un nombre para la tabla')
        importTableFromJSON(tableName.trim(), content)
        const tbl = tableName.trim()
        store.registerDatabase(
          store.activeDbName,
          [...(store.databases.find(d => d.name === store.activeDbName)?.tables ?? []), tbl]
        )
        setResult({ tablesCreated: [tbl], tablesReferenced: [tbl], rowsInserted: getAllTableInfos().find(t => t.name === tbl)?.rowCount ?? 0, errors: [], dbName: store.activeDbName, warnings: [] })
      } else {
        // SQL import
        const res = importTableFromSQL(content)
        setResult(res)
        // Use tablesReferenced (from CREATE TABLE) so tables already in alasql also register
        const tablesToRegister = res.tablesReferenced.length > 0
          ? res.tablesReferenced
          : res.tablesCreated
        if (tablesToRegister.length > 0 || res.dbName) {
          const dbName = res.dbName ?? store.activeDbName
          const colorIdx = store.databases.length % DB_COLORS.length
          const existingTables = store.databases.find(d => d.name === dbName)?.tables ?? []
          store.registerDatabase(
            dbName,
            [...new Set([...existingTables, ...tablesToRegister])],
            DB_COLORS[colorIdx],
          )
        }
      }
      store.incrementDbVersion()
      refresh()
    } catch (e: unknown) {
      setSimpleError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  function handlePreview(name: string) {
    const r = getTablePreview(name, 50)
    setPreviewData({ columns: r.columns, rows: r.rows })
    setPreviewTable(name)
    setActiveTab('preview')
  }

  function handleDrop(name: string) {
    if (!confirm(`¿Eliminar la tabla "${name}"?`)) return
    dropTable(name)
    // Remove from databases
    store.databases.forEach(db => {
      if (db.tables.includes(name)) {
        store.registerDatabase(db.name, db.tables.filter(t => t !== name))
      }
    })
    store.incrementDbVersion()
    refresh()
    if (previewTable === name) { setPreviewTable(null); setPreviewData(null) }
  }

  const preprocessed = importMode === 'sql' && content ? preprocessSQL(content) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[820px] max-h-[88vh] bg-surface-800 border border-surface-500 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-600 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Database size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Gestionar Base de Datos</h2>
              <p className="text-[10px] text-slate-400">Importar y administrar tus propias tablas</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-600 text-slate-400 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex border-b border-surface-600 shrink-0 bg-surface-800">
          {([
            { id: 'import', icon: <Upload size={12} />,  label: 'Importar datos' },
            { id: 'tables', icon: <Table2 size={12} />,  label: `Mis tablas (${tables.length})` },
            { id: 'preview', icon: <Eye size={12} />,    label: previewTable ? `Vista: ${previewTable}` : 'Vista previa', disabled: !previewTable },
          ] as const).map(t => (
            <button key={t.id} disabled={'disabled' in t && t.disabled}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-medium border-b-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === t.id ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >{t.icon}{t.label}</button>
          ))}
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">

          {/* ── IMPORT TAB ──────────────────────────────────────────────── */}
          {activeTab === 'import' && (
            <div className="flex h-full">
              {/* Left sidebar */}
              <div className="w-[190px] border-r border-surface-600 p-3 flex flex-col gap-1 shrink-0 bg-surface-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">Formato</p>
                {([
                  { id: 'sql'  as const, icon: <Code2 size={14} />, label: 'SQL',  desc: 'CREATE + INSERT' },
                  { id: 'csv'  as const, icon: <FileText size={14} />, label: 'CSV',  desc: 'Hoja de datos' },
                  { id: 'json' as const, icon: <FileJson size={14} />, label: 'JSON', desc: 'Array de objetos' },
                ]).map(f => (
                  <button key={f.id} onClick={() => handleModeChange(f.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      importMode === f.id ? 'bg-blue-600/20 border border-blue-600/50 text-white' : 'hover:bg-surface-600 text-slate-300 border border-transparent'
                    }`}
                  >
                    <span className={importMode === f.id ? 'text-blue-400' : 'text-slate-500'}>{f.icon}</span>
                    <div>
                      <div className="text-xs font-semibold">{f.label}</div>
                      <div className="text-[10px] text-slate-500">{f.desc}</div>
                    </div>
                  </button>
                ))}

                <div className="mt-auto pt-3 border-t border-surface-600 space-y-1.5">
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium bg-surface-600 hover:bg-surface-500 text-slate-300 hover:text-white rounded-lg border border-surface-500 transition-colors">
                    <Upload size={12} /> Subir archivo
                  </button>
                  <input ref={fileRef} type="file" accept=".csv,.json,.sql,.txt" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>

              {/* Right: editor */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* DB name detection banner */}
                {detectedDb && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 border-b border-blue-800/40 shrink-0">
                    <Info size={13} className="text-blue-400 shrink-0" />
                    <span className="text-xs text-blue-300">
                      Base de datos detectada: <strong className="text-white">{detectedDb}</strong>
                      {' — '}las tablas se registrarán bajo este nombre
                    </span>
                  </div>
                )}

                <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
                  {importMode !== 'sql' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nombre de la tabla</label>
                      <input type="text" placeholder="Ej: clientes, ventas, productos..."
                        value={tableName} onChange={e => setTableName(e.target.value.replace(/\s/g, '_'))}
                        className="w-full bg-surface-700 border border-surface-500 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors placeholder-slate-600"
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-400">
                        Contenido {importMode.toUpperCase()}
                      </label>
                      <span className="text-[10px] text-slate-600">
                        {content.split('\n').length} líneas · {content.length} caracteres
                      </span>
                    </div>
                    <textarea value={content} onChange={e => setContent(e.target.value)} spellCheck={false}
                      className="flex-1 min-h-[200px] bg-surface-900 border border-surface-600 focus:border-blue-500 rounded-lg p-3 text-xs font-mono text-slate-200 outline-none resize-none transition-colors"
                      placeholder={importMode === 'sql'
                        ? '-- Pega aquí tu script SQL\nCREATE TABLE tabla (...)\nINSERT INTO tabla VALUES (...)'
                        : importMode === 'csv'
                          ? 'id,nombre,precio\n1,Producto A,99.99'
                          : '[{"id":1,"nombre":"Item","valor":100}]'}
                    />
                  </div>

                  {/* Preprocessor preview */}
                  {importMode === 'sql' && preprocessed && content.trim() && (
                    <div className="border border-surface-600 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setShowPreprocessed(o => !o)}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-surface-700 hover:bg-surface-600 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        {showPreprocessed ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span>Ver SQL procesado</span>
                        {preprocessed.skipped.length > 0 && (
                          <span className="ml-auto text-yellow-500 flex items-center gap-1">
                            <AlertTriangle size={11} />
                            {preprocessed.skipped.length} sentencia{preprocessed.skipped.length !== 1 ? 's' : ''} omitida{preprocessed.skipped.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </button>
                      {showPreprocessed && (
                        <pre className="p-3 bg-surface-900 text-[10px] font-mono text-slate-400 overflow-auto max-h-32">
                          {preprocessed.processed}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Result feedback */}
                  {result && (
                    <div className={`rounded-lg border overflow-hidden ${result.errors.length === 0 ? 'border-green-700/50 bg-green-900/20' : 'border-yellow-700/50 bg-yellow-900/10'}`}>
                      <div className="flex items-start gap-2 px-3 py-2.5">
                        {result.errors.length === 0
                          ? <CheckCircle2 size={14} className="text-green-400 shrink-0 mt-0.5" />
                          : <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />}
                        <div className="flex-1 text-xs">
                          {result.tablesCreated.length > 0 && (
                            <p className="text-green-300 font-semibold mb-1">
                              ✓ {result.tablesCreated.length} tabla{result.tablesCreated.length !== 1 ? 's' : ''} creada{result.tablesCreated.length !== 1 ? 's' : ''}
                              {result.dbName && <span className="text-slate-400 font-normal"> en <strong className="text-white">{result.dbName}</strong></span>}
                            </p>
                          )}
                          {result.tablesCreated.length > 0 && (
                            <p className="text-slate-400 text-[10px] mb-1">
                              {result.tablesCreated.join(' · ')}
                            </p>
                          )}
                          {result.rowsInserted > 0 && (
                            <p className="text-blue-300 text-[10px]">✓ {result.rowsInserted} filas insertadas</p>
                          )}
                          {result.errors.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-yellow-400 font-semibold">{result.errors.length} advertencia{result.errors.length !== 1 ? 's' : ''}:</p>
                              {result.errors.slice(0, 4).map((err, i) => (
                                <div key={i} className="text-[10px] text-yellow-300/70 font-mono bg-surface-900/50 px-2 py-1 rounded">
                                  <span className="text-slate-500">{err.statement}</span><br />
                                  → {err.message}
                                </div>
                              ))}
                              {result.errors.length > 4 && (
                                <p className="text-[10px] text-slate-500">...y {result.errors.length - 4} más</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {simpleError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-xs text-red-300">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      {simpleError}
                    </div>
                  )}

                  <button onClick={handleImport} disabled={loading || !content.trim()}
                    className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Plus size={15} />}
                    {loading ? 'Importando...' : 'Importar tabla'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TABLES TAB ─────────────────────────────────────────────── */}
          {activeTab === 'tables' && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-600 shrink-0 bg-surface-800">
                <span className="text-xs text-slate-400">{tables.length} tabla{tables.length !== 1 ? 's' : ''} en memoria</span>
                <button onClick={refresh} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                  <RefreshCw size={11} /> Actualizar
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {tables.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-500">
                    <Table2 size={28} />
                    <div className="text-sm">No hay tablas. Importa datos o usa el editor SQL.</div>
                    <button onClick={() => setActiveTab('import')} className="text-xs text-blue-400 hover:text-blue-300">
                      Ir a Importar →
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-600 bg-surface-800 sticky top-0">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tabla</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Filas</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Columnas</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">BD</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {tables.map(t => {
                        const dbEntry = store.databases.find(d => d.tables.includes(t.name))
                        return (
                          <tr key={t.name} className="border-b border-surface-700 hover:bg-surface-700/50 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <Table2 size={13} className="text-blue-400 shrink-0" />
                                <span className="font-mono text-white font-medium">{t.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-blue-300 text-sm">{t.rowCount}</td>
                            <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[240px]">
                              <span className="truncate block">{t.columns.join(', ') || '—'}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              {dbEntry ? (
                                <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                  <span className="w-2 h-2 rounded-full" style={{ background: dbEntry.color }} />
                                  {dbEntry.name}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => handlePreview(t.name)} title="Ver datos"
                                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 transition-colors">
                                  <Eye size={13} />
                                </button>
                                <button onClick={() => handleDrop(t.name)} title="Eliminar tabla"
                                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-600/30 text-slate-400 hover:text-red-400 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── PREVIEW TAB ────────────────────────────────────────────── */}
          {activeTab === 'preview' && previewData && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-surface-600 shrink-0 bg-surface-800">
                <div className="flex items-center gap-2">
                  <Table2 size={13} className="text-blue-400" />
                  <span className="text-xs font-mono font-bold text-white">{previewTable}</span>
                  <span className="text-[10px] text-slate-500">{previewData.rows.length} filas · {previewData.columns.length} columnas</span>
                </div>
                <button onClick={() => setActiveTab('tables')} className="text-xs text-slate-400 hover:text-white">← Volver</button>
              </div>
              <div className="flex-1 overflow-auto">
                {previewData.rows.length > 0 ? (
                  <table className="results-table">
                    <thead><tr>{previewData.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {previewData.rows.map((row, i) => (
                        <tr key={i}>{previewData.columns.map(c => <td key={c}>{String(row[c] ?? 'NULL')}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-500 text-sm">
                    <span>Tabla vacía</span>
                    <code className="text-xs bg-surface-700 px-2 py-1 rounded text-slate-400">INSERT INTO {previewTable} ...</code>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
