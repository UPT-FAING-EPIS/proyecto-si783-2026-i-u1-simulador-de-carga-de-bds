import { X, FileText, FileJson, FileSpreadsheet, Code2, Download, Database } from 'lucide-react'
import { useStore, getActiveTab } from '../../store/useStore'
import { getAllTableInfos, getTablePreview } from '../../engines/sqlEngine'
import { idbLoadAllSchemas } from '../../db/idbStorage'
import { generateEngineExport } from '../../engines/exportHelper'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

interface Props { onClose: () => void }

export default function ExportModal({ onClose }: Props) {
  const store = useStore()
  const tab = getActiveTab(store)
  const results = tab?.results
  const hasResults = !!(results && results.rows.length > 0)

  // ── Results export ────────────────────────────────────────────────────────
  function exportCSV() {
    if (!results) return
    const header = results.columns.join(',')
    const rows = results.rows.map(r =>
      results.columns.map(c => {
        const v = String(r[c] ?? '')
        return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v
      }).join(',')
    )
    saveAs(new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' }), 'resultados.csv')
    onClose()
  }

  function exportJSON() {
    if (!results) return
    saveAs(new Blob([JSON.stringify(results.rows, null, 2)], { type: 'application/json' }), 'resultados.json')
    onClose()
  }

  function exportExcel() {
    if (!results) return
    const ws = XLSX.utils.json_to_sheet(results.rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados')
    XLSX.writeFile(wb, 'resultados.xlsx')
    onClose()
  }

  // ── Query export ──────────────────────────────────────────────────────────
  function exportSQL() {
    const sql = tab?.query ?? ''
    if (!sql.trim()) return
    saveAs(new Blob([sql], { type: 'text/plain;charset=utf-8' }), 'consulta.sql')
    onClose()
  }

  function exportQueryTXT() {
    const sql = tab?.query ?? ''
    if (!sql.trim()) return
    saveAs(new Blob([sql], { type: 'text/plain;charset=utf-8' }), 'consulta.txt')
    onClose()
  }

  // ── Schema export ─────────────────────────────────────────────────────────
  function exportSchemaDDL() {
    const tables = getAllTableInfos()
    const ddl = tables.map(t => {
      const cols = t.columns.map(c => `  ${c} TEXT`).join(',\n')
      return `CREATE TABLE ${t.name} (\n${cols}\n);`
    }).join('\n\n')
    saveAs(new Blob([ddl], { type: 'text/plain;charset=utf-8' }), 'schema.sql')
    onClose()
  }

  function exportSchemaJSON() {
    const tables = getAllTableInfos()
    const schema = tables.map(t => ({ table: t.name, columns: t.columns, rowCount: t.rowCount }))
    saveAs(new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' }), 'schema.json')
    onClose()
  }

  // ── Full DB export (engine-aware) ────────────────────────────────────────
  async function exportFullDB() {
    const dbName    = store.activeDbName || 'MyDatabase'
    const engine    = (tab?.engine ?? 'sqlserver') as Parameters<typeof generateEngineExport>[0]
    const schemas   = await idbLoadAllSchemas()
    const schema    = schemas.find(s => s.dbName === dbName)
    const allTables = getAllTableInfos()

    const orderedNames = schema
      ? [...schema.tableOrder, ...allTables.map(t => t.name).filter(n => !schema.tableOrder.includes(n))]
      : allTables.map(t => t.name)

    const { content, filename } = generateEngineExport(
      engine,
      dbName,
      schema,
      orderedNames,
      allTables,
      (name) => getTablePreview(name, 1_000_000),
    )

    saveAs(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename)
    onClose()
  }

  const Section = ({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-slate-400">{icon}</span>
        <div>
          <div className="text-xs font-semibold text-white">{title}</div>
          <div className="text-[10px] text-slate-500">{subtitle}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-6">{children}</div>
    </div>
  )

  const Btn = ({ icon, label, ext, disabled, onClick }: { icon: React.ReactNode; label: string; ext: string; disabled?: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'No hay datos para exportar' : undefined}
      className="flex items-center gap-2 px-3.5 py-2 bg-surface-600 hover:bg-surface-500 disabled:opacity-35 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-lg border border-surface-500 hover:border-surface-400 text-xs font-medium transition-all"
    >
      <span className="text-blue-400">{icon}</span>
      {label}
      <span className="text-[10px] text-slate-500 font-mono">.{ext}</span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[500px] bg-surface-800 border border-surface-500 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-600">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center">
              <Download size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Exportar</h2>
              <p className="text-[10px] text-slate-400">Descarga resultados, consultas y esquema</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-600 text-slate-400 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <Section icon={<FileText size={15} />} title="Resultados de la consulta" subtitle={hasResults ? `${results!.rowCount} filas · ${results!.columns.length} columnas` : 'Ejecuta una consulta primero'}>
            <Btn icon={<FileText size={13} />} label="CSV" ext="csv" disabled={!hasResults} onClick={exportCSV} />
            <Btn icon={<FileJson size={13} />} label="JSON" ext="json" disabled={!hasResults} onClick={exportJSON} />
            <Btn icon={<FileSpreadsheet size={13} />} label="Excel" ext="xlsx" disabled={!hasResults} onClick={exportExcel} />
          </Section>

          <div className="border-t border-surface-700 my-3" />

          <Section icon={<Code2 size={15} />} title="Consulta actual" subtitle={tab?.query?.trim() ? 'SQL del editor activo' : 'Editor vacío'}>
            <Btn icon={<Code2 size={13} />} label="SQL" ext="sql" disabled={!tab?.query?.trim()} onClick={exportSQL} />
            <Btn icon={<FileText size={13} />} label="Texto" ext="txt" disabled={!tab?.query?.trim()} onClick={exportQueryTXT} />
          </Section>

          <div className="border-t border-surface-700 my-3" />

          <Section icon={<Database size={15} />} title="Esquema de base de datos" subtitle={`${getAllTableInfos().length} tablas en memoria`}>
            <Btn icon={<Code2 size={13} />} label="DDL" ext="sql" onClick={exportSchemaDDL} />
            <Btn icon={<FileJson size={13} />} label="JSON Schema" ext="json" onClick={exportSchemaJSON} />
            <Btn icon={<Download size={13} />} label="BD Completa" ext="sql" onClick={() => { exportFullDB() }} />
          </Section>
        </div>
      </div>
    </div>
  )
}
