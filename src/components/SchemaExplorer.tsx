import { useState, useEffect } from 'react'
import {
  ChevronRight, ChevronDown, Table2, Hash,
  Key, List, Columns3, Database, Trash2,
} from 'lucide-react'
import { getAllTableInfos, getTablePreview, dropDatabaseTables, type TableInfo } from '../engines/sqlEngine'
import { useStore } from '../store/useStore'

// ─── Tree node ────────────────────────────────────────────────────────────────

interface Node {
  label: string
  sublabel?: string
  icon: React.ReactNode
  iconColor?: string
  children?: Node[]
  badge?: string
  onClick?: () => void
}

function NodeRow({
  node, depth = 0, onPreview,
}: {
  node: Node; depth?: number; onPreview?: (label: string) => void
}) {
  const [open, setOpen] = useState(depth <= 1)
  const has = !!node.children?.length
  const indent = depth * 14 + 6

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 rounded px-1 py-[3px] transition-colors cursor-pointer ${
          has ? 'hover:bg-surface-500/60' : 'hover:bg-surface-500/40'
        }`}
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => {
          if (has) setOpen(o => !o)
          if (node.onClick) node.onClick()
        }}
      >
        <span className="w-3 shrink-0 flex items-center">
          {has
            ? (open ? <ChevronDown size={9} className="text-slate-500" /> : <ChevronRight size={9} className="text-slate-500" />)
            : null}
        </span>
        <span className={`shrink-0 flex items-center ${node.iconColor ?? 'text-slate-400'}`}>
          {node.icon}
        </span>
        <span className="text-[11px] text-slate-200 truncate flex-1">{node.label}</span>
        {node.sublabel && (
          <span className="text-[10px] text-slate-500 font-mono shrink-0 mr-1">{node.sublabel}</span>
        )}
        {node.badge !== undefined && (
          <span className="text-[10px] text-slate-500 font-mono shrink-0">({node.badge})</span>
        )}
      </div>
      {open && has && node.children!.map((c, i) => (
        <NodeRow key={i} node={c} depth={depth + 1} onPreview={onPreview} />
      ))}
    </div>
  )
}

// ─── SQL engine metadata ──────────────────────────────────────────────────────

const SQL_ENGINE_META = [
  { key: 'sqlserver',  label: 'SQL Server',  color: '#0078d4' },
  { key: 'mysql',      label: 'MySQL',       color: '#f29111' },
  { key: 'postgresql', label: 'PostgreSQL',  color: '#336791' },
  { key: 'sqlite',     label: 'SQLite',      color: '#44b0ff' },
  { key: 'oracle',     label: 'Oracle',      color: '#c74634' },
] as const

// ─── Build tree for a SQL database ───────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  INT: '🔢', DECIMAL: '🔢', FLOAT: '🔢', DOUBLE: '🔢',
  VARCHAR: '📝', TEXT: '📝', CHAR: '📝', NVARCHAR: '📝',
  DATE: '📅', DATETIME: '📅', TIMESTAMP: '📅',
  BOOLEAN: '✅', BIT: '✅',
}

function buildDBTree(dbName: string, tables: TableInfo[], allTables: TableInfo[], onPreview: (name: string) => void): Node[] {
  const dbTables = tables.filter(t => allTables.some(at => at.name === t.name))

  return [{
    label: dbName,
    icon: <Database size={12} />,
    iconColor: 'text-yellow-400',
    badge: String(dbTables.length),
    children: [
      {
        label: 'Tablas',
        badge: String(dbTables.length),
        icon: <Table2 size={11} />,
        iconColor: 'text-blue-400',
        children: dbTables.length > 0 ? dbTables.map(t => ({
          label: t.name,
          badge: String(t.rowCount),
          icon: <Table2 size={11} />,
          iconColor: 'text-slate-400',
          onClick: () => onPreview(t.name),
          children: t.columns.length > 0 ? t.columns.map(col => ({
            label: col,
            icon: <Columns3 size={10} />,
            iconColor: 'text-slate-500',
          })) : undefined,
        })) : [{ label: 'Sin tablas', icon: <span />, iconColor: 'text-slate-600' }],
      },
    ],
  }]
}

function buildMongoTree(dbName: string, tables: TableInfo[], onPreview: (name: string) => void): Node[] {
  return [{
    label: dbName,
    icon: <Database size={12} />,
    iconColor: 'text-green-400',
    badge: String(tables.length),
    children: [
      {
        label: 'Colecciones',
        badge: String(tables.length),
        icon: <Table2 size={11} />,
        iconColor: 'text-green-400',
        children: tables.length > 0 ? tables.map(t => ({
          label: t.name,
          badge: `${t.rowCount} docs`,
          icon: <Table2 size={11} />,
          iconColor: 'text-slate-400',
          onClick: () => onPreview(t.name),
          children: [
            { label: '_id', sublabel: 'ObjectId', icon: <Hash size={10} />, iconColor: 'text-yellow-500' },
            ...t.columns.map(col => ({
              label: col,
              sublabel: 'field',
              icon: <Columns3 size={10} />,
              iconColor: 'text-slate-500',
            })),
          ],
        })) : [{ label: 'Sin colecciones', icon: <span />, iconColor: 'text-slate-600' }],
      },
      {
        label: 'Índices',
        badge: String(tables.length),
        icon: <Hash size={11} />,
        iconColor: 'text-yellow-400',
        children: [
          { label: '_id_ (default)', icon: <Hash size={10} />, iconColor: 'text-slate-500' },
          ...tables.map(t => ({ label: `${t.name}._id`, icon: <Hash size={10} />, iconColor: 'text-slate-500' })),
        ],
      },
    ],
  }]
}

function buildRedisTree(dbName: string, tables: TableInfo[], onPreview: (name: string) => void): Node[] {
  const totalKeys = tables.reduce((s, t) => s + t.rowCount, 0)
  return [{
    label: dbName,
    icon: <Database size={12} />,
    iconColor: 'text-red-400',
    badge: String(totalKeys),
    children: [
      {
        label: 'Hashes',
        badge: String(totalKeys),
        icon: <Hash size={11} />,
        iconColor: 'text-red-400',
        children: tables.length > 0 ? tables.map(t => ({
          label: `${t.name}:{id}`,
          sublabel: `${t.rowCount} keys`,
          icon: <Hash size={10} />,
          iconColor: 'text-slate-500',
          onClick: () => onPreview(t.name),
          children: t.columns.map(col => ({
            label: col,
            icon: <Columns3 size={10} />,
            iconColor: 'text-slate-600',
          })),
        })) : [{ label: 'Sin datos', icon: <span />, iconColor: 'text-slate-600' }],
      },
      {
        label: 'Patrones de clave',
        badge: String(tables.length),
        icon: <Key size={11} />,
        iconColor: 'text-purple-400',
        children: tables.map(t => ({
          label: `${t.name}:*`,
          icon: <Key size={10} />,
          iconColor: 'text-slate-500',
        })),
      },
      {
        label: 'Listas',
        icon: <List size={11} />,
        iconColor: 'text-blue-400',
        children: tables.slice(0, 3).map(t => ({
          label: `lista:${t.name}`,
          icon: <List size={10} />,
          iconColor: 'text-slate-500',
        })),
      },
    ],
  }]
}

// ─── Database card ────────────────────────────────────────────────────────────

interface CardProps {
  title: string
  subtitle: string
  accentColor: string
  tree: Node[]
  isActive?: boolean
  onPreview: (name: string) => void
  onDelete?: () => void
}

function DBCard({ title, subtitle, accentColor, tree, isActive, onPreview, onDelete }: CardProps) {
  return (
    <div
      className={`bg-surface-700 border rounded-lg overflow-hidden shrink-0 transition-all group/card ${
        isActive ? 'border-blue-500/60 shadow-md shadow-blue-900/20' : 'border-surface-600'
      }`}
      style={{ minWidth: 210, maxWidth: 260 }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-600">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: accentColor }} />
        <div className="flex-1 overflow-hidden">
          <div className="text-xs font-bold text-white truncate">{title}</div>
          <div className="text-[10px] text-slate-500 truncate">{subtitle}</div>
        </div>
        {isActive && (
          <span className="text-[10px] text-blue-400 font-semibold shrink-0 bg-blue-900/30 px-1.5 py-0.5 rounded">activa</span>
        )}
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            title="Eliminar base de datos"
            className="opacity-0 group-hover/card:opacity-100 ml-1 w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
      <div className="p-1.5 overflow-y-auto max-h-[200px]">
        {tree.map((node, i) => <NodeRow key={i} node={node} onPreview={onPreview} />)}
      </div>
    </div>
  )
}

// ─── Preview panel ────────────────────────────────────────────────────────────

function PreviewPanel({ tableName, onClose }: { tableName: string; onClose: () => void }) {
  const result = getTablePreview(tableName, 20)
  return (
    <div className="shrink-0 border-l border-surface-600 bg-surface-900" style={{ minWidth: 320, maxWidth: 500 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-600">
        <div className="flex items-center gap-2">
          <Table2 size={12} className="text-blue-400" />
          <span className="text-xs font-bold text-white">{tableName}</span>
          <span className="text-[10px] text-slate-500">{result.rowCount} filas</span>
        </div>
        <button onClick={onClose} className="text-[10px] text-slate-500 hover:text-white transition-colors">✕ cerrar</button>
      </div>
      {result.rows.length > 0 ? (
        <div className="overflow-auto max-h-[200px]">
          <table className="results-table text-[11px]">
            <thead><tr>{result.columns.map(c => <th key={c} className="text-[10px]">{c}</th>)}</tr></thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i}>{result.columns.map(c => (
                  <td key={c} className="py-1 text-[11px]">{String(row[c] ?? 'NULL')}</td>
                ))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center h-20 text-xs text-slate-500">
          Tabla vacía — usa INSERT INTO {tableName} para añadir datos
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SchemaExplorer() {
  const store = useStore()
  const { databases, activeDbName, tabs, dbVersion } = store
  const [allTables, setAllTables] = useState<TableInfo[]>([])
  const [previewTable, setPreviewTable] = useState<string | null>(null)

  const hasRedis  = tabs.some(t => t.engine === 'redis')
  const hasMongo  = tabs.some(t => t.engine === 'mongodb')

  useEffect(() => {
    setAllTables(getAllTableInfos())
  }, [dbVersion])

  function handleDeleteDB(db: { name: string; tables: string[] }) {
    if (!confirm(`¿Eliminar "${db.name}" y todas sus tablas (${db.tables.length})? Esta acción no se puede deshacer.`)) return
    dropDatabaseTables(db.tables)
    store.unregisterDatabase(db.name)
    store.incrementDbVersion()
    setPreviewTable(null)
  }

  const totalTables = allTables.length

  return (
    <div className="bg-surface-800 border-t border-surface-600 flex flex-col" style={{ height: '100%' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-surface-600">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          🗂 Explorador de Esquemas
        </span>
        <span className="text-[10px] text-slate-500">
          — {totalTables} tabla{totalTables !== 1 ? 's' : ''} · {databases.length} base{databases.length !== 1 ? 's' : ''} de datos
        </span>
      </div>

      {/* Cards + Preview */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Scrollable cards */}
        <div className="flex gap-3 p-3 overflow-x-auto flex-1">
          {/* One card per active SQL engine per registered database */}
          {SQL_ENGINE_META
            .filter(eng => tabs.some(t => t.engine === eng.key))
            .flatMap(eng =>
              databases.map(db => {
                const dbTableInfos = allTables.filter(t => db.tables.includes(t.name))
                return (
                  <DBCard
                    key={`${eng.key}-${db.name}`}
                    title={db.name}
                    subtitle={`${dbTableInfos.length} tablas · ${eng.label}`}
                    accentColor={eng.color}
                    isActive={db.name === activeDbName}
                    tree={buildDBTree(db.name, dbTableInfos, allTables, setPreviewTable)}
                    onPreview={setPreviewTable}
                    onDelete={eng.key === 'sqlserver' ? () => handleDeleteDB(db) : undefined}
                  />
                )
              })
            )}

          {/* Tables not belonging to any registered DB */}
          {(() => {
            const registered = new Set(databases.flatMap(d => d.tables))
            const orphans = allTables.filter(t => !registered.has(t.name))
            if (orphans.length === 0) return null
            return (
              <DBCard
                key="__other__"
                title="Otras tablas"
                subtitle={`${orphans.length} tabla${orphans.length !== 1 ? 's' : ''} sin asignar`}
                accentColor="#64748b"
                tree={buildDBTree('Otras tablas', orphans, allTables, setPreviewTable)}
                onPreview={setPreviewTable}
              />
            )
          })()}

          {/* MongoDB card — one per registered database */}
          {hasMongo && databases.map(db => {
            const dbTableInfos = allTables.filter(t => db.tables.includes(t.name))
            return (
              <DBCard
                key={`mongodb-${db.name}`}
                title={db.name}
                subtitle={`${dbTableInfos.length} colecciones · MongoDB`}
                accentColor="#47a248"
                tree={buildMongoTree(db.name, dbTableInfos, setPreviewTable)}
                isActive={db.name === activeDbName}
                onPreview={setPreviewTable}
              />
            )
          })}

          {/* Redis card — one per registered database */}
          {hasRedis && databases.map(db => {
            const dbTableInfos = allTables.filter(t => db.tables.includes(t.name))
            return (
              <DBCard
                key={`redis-${db.name}`}
                title={db.name}
                subtitle={`${dbTableInfos.reduce((s, t) => s + t.rowCount, 0)} keys · Redis`}
                accentColor="#dc382d"
                tree={buildRedisTree(db.name, dbTableInfos, setPreviewTable)}
                isActive={db.name === activeDbName}
                onPreview={setPreviewTable}
              />
            )
          })}
        </div>

        {/* Inline preview panel */}
        {previewTable && (
          <PreviewPanel tableName={previewTable} onClose={() => setPreviewTable(null)} />
        )}
      </div>
    </div>
  )
}
