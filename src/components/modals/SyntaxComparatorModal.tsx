import { useState } from 'react'
import { X, Copy, Check, GitCompare } from 'lucide-react'

type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION'

interface EngineEntry {
  key: string
  name: string
  emoji: string
  color: string
  tag: string
  tagColor: string
}

const ENGINES: EngineEntry[] = [
  { key: 'mysql',      name: 'MySQL',      emoji: '🐬', color: '#4479a1', tag: 'SQL',   tagColor: 'text-blue-400 bg-blue-900/30 border-blue-800/40' },
  { key: 'postgresql', name: 'PostgreSQL',  emoji: '🐘', color: '#336791', tag: 'SQL',   tagColor: 'text-blue-400 bg-blue-900/30 border-blue-800/40' },
  { key: 'oracle',     name: 'Oracle',      emoji: '🔶', color: '#c74634', tag: 'SQL',   tagColor: 'text-blue-400 bg-blue-900/30 border-blue-800/40' },
  { key: 'sqlserver',  name: 'SQL Server',  emoji: '🔴', color: '#e74c3c', tag: 'T-SQL', tagColor: 'text-blue-400 bg-blue-900/30 border-blue-800/40' },
  { key: 'sqlite',     name: 'SQLite',      emoji: '💎', color: '#0085CA', tag: 'SQL',   tagColor: 'text-blue-400 bg-blue-900/30 border-blue-800/40' },
  { key: 'mongodb',    name: 'MongoDB',     emoji: '🍃', color: '#47a248', tag: 'NoSQL', tagColor: 'text-emerald-400 bg-emerald-900/30 border-emerald-800/40' },
  { key: 'redis',      name: 'Redis',       emoji: '⚡', color: '#dc382d', tag: 'KV',    tagColor: 'text-orange-400 bg-orange-900/30 border-orange-800/40' },
]

interface ScriptEntry { script: string; note: string }
type ScriptMap = Record<string, Record<QueryType, ScriptEntry>>

const SCRIPTS: ScriptMap = {
  mysql: {
    SELECT:      { script: `SELECT *\nFROM orders\nWHERE user_id = 42\nORDER BY created_at DESC\nLIMIT 25;`,                                                                                                                                   note: 'Paginación: LIMIT n' },
    INSERT:      { script: `INSERT INTO audit_log\n  (user_id, action, created_at)\nVALUES\n  (42, 'login', NOW());`,                                                                                                                          note: 'Fecha actual: NOW()' },
    UPDATE:      { script: `UPDATE inventory\nSET stock = stock - 1\nWHERE product_id = 3;`,                                                                                                                                                   note: 'Sintaxis estándar SQL' },
    DELETE:      { script: `DELETE FROM sessions\nWHERE last_seen\n  < NOW() - INTERVAL 30 DAY;`,                                                                                                                                              note: 'Intervalo: INTERVAL 30 DAY' },
    TRANSACTION: { script: `BEGIN;\n\nUPDATE inventory\n  SET stock = stock - 1\n  WHERE product_id = 3;\n\nINSERT INTO orders\n  (user_id, product_id, created_at)\nVALUES\n  (42, 3, NOW());\n\nCOMMIT;\n-- ROLLBACK; (en caso de error)`,   note: 'BEGIN para iniciar — COMMIT / ROLLBACK' },
  },
  postgresql: {
    SELECT:      { script: `SELECT *\nFROM orders\nWHERE user_id = 42\nORDER BY created_at DESC\nLIMIT 25;`,                                                                                                                                   note: 'Paginación: LIMIT n' },
    INSERT:      { script: `INSERT INTO audit_log\n  (user_id, action, created_at)\nVALUES\n  (42, 'login', NOW())\nON CONFLICT DO NOTHING;`,                                                                                                  note: "ON CONFLICT DO NOTHING (upsert)" },
    UPDATE:      { script: `UPDATE inventory\nSET stock = stock - 1\nWHERE product_id = 3;`,                                                                                                                                                   note: 'Sintaxis estándar SQL' },
    DELETE:      { script: `DELETE FROM sessions\nWHERE last_seen\n  < NOW() - INTERVAL '30 days';`,                                                                                                                                           note: "Intervalo entre comillas: '30 days'" },
    TRANSACTION: { script: `BEGIN;\n\nUPDATE inventory\n  SET stock = stock - 1\n  WHERE product_id = 3;\n\nINSERT INTO orders\n  (user_id, product_id, created_at)\nVALUES\n  (42, 3, NOW());\n\nCOMMIT;\n-- ROLLBACK; (en caso de error)`,   note: 'BEGIN para iniciar — igual que MySQL' },
  },
  oracle: {
    SELECT:      { script: `SELECT *\nFROM orders\nWHERE user_id = 42\nORDER BY created_at DESC\nFETCH FIRST 25 ROWS ONLY;`,                                                                                                                   note: 'Paginación: FETCH FIRST n ROWS ONLY' },
    INSERT:      { script: `INSERT INTO audit_log\n  (user_id, action, created_at)\nVALUES\n  (42, 'login', SYSDATE);`,                                                                                                                        note: 'Fecha actual: SYSDATE' },
    UPDATE:      { script: `UPDATE inventory\nSET stock = stock - 1\nWHERE product_id = 3;`,                                                                                                                                                   note: 'Sintaxis estándar SQL' },
    DELETE:      { script: `DELETE FROM sessions\nWHERE last_seen < SYSDATE - 30;`,                                                                                                                                                            note: 'Intervalo: SYSDATE - 30 (días numéricos)' },
    TRANSACTION: { script: `-- Transacción implícita al primer DML\n-- No existe BEGIN explícito\n\nUPDATE inventory\n  SET stock = stock - 1\n  WHERE product_id = 3;\n\nINSERT INTO orders\n  (user_id, product_id, created_at)\nVALUES\n  (42, 3, SYSDATE);\n\nCOMMIT;\n-- ROLLBACK; (en caso de error)`, note: 'Transacción implícita — solo COMMIT / ROLLBACK' },
  },
  sqlserver: {
    SELECT:      { script: `SELECT TOP 25 *\nFROM orders\nWHERE user_id = 42\nORDER BY created_at DESC;`,                                                                                                                                      note: 'Paginación: TOP n va al inicio' },
    INSERT:      { script: `INSERT INTO audit_log\n  (user_id, action, created_at)\nVALUES\n  (42, 'login', GETDATE());`,                                                                                                                      note: 'Fecha actual: GETDATE()' },
    UPDATE:      { script: `UPDATE inventory\nSET stock = stock - 1\nWHERE product_id = 3;`,                                                                                                                                                   note: 'Sintaxis estándar T-SQL' },
    DELETE:      { script: `DELETE FROM sessions\nWHERE last_seen\n  < DATEADD(day, -30, GETDATE());`,                                                                                                                                         note: 'Intervalo: DATEADD(day, -30, ...)' },
    TRANSACTION: { script: `BEGIN TRANSACTION;\n\nUPDATE inventory\n  SET stock = stock - 1\n  WHERE product_id = 3;\n\nINSERT INTO orders\n  (user_id, product_id, created_at)\nVALUES\n  (42, 3, GETDATE());\n\nCOMMIT TRANSACTION;\n-- ROLLBACK TRANSACTION; (error)`, note: 'BEGIN TRANSACTION / COMMIT TRANSACTION' },
  },
  sqlite: {
    SELECT:      { script: `SELECT *\nFROM orders\nWHERE user_id = 42\nORDER BY created_at DESC\nLIMIT 25;`,                                                                                                                                   note: 'Paginación: LIMIT n' },
    INSERT:      { script: `INSERT INTO audit_log\n  (user_id, action, created_at)\nVALUES\n  (42, 'login', datetime('now'));`,                                                                                                                 note: "Fecha actual: datetime('now')" },
    UPDATE:      { script: `UPDATE inventory\nSET stock = stock - 1\nWHERE product_id = 3;`,                                                                                                                                                   note: 'Sintaxis estándar SQL' },
    DELETE:      { script: `DELETE FROM sessions\nWHERE last_seen\n  < datetime('now', '-30 days');`,                                                                                                                                          note: "Intervalo: datetime('now', '-30 days')" },
    TRANSACTION: { script: `BEGIN TRANSACTION;\n\nUPDATE inventory\n  SET stock = stock - 1\n  WHERE product_id = 3;\n\nINSERT INTO orders\n  (user_id, product_id, created_at)\nVALUES\n  (42, 3, datetime('now'));\n\nCOMMIT;\n-- ROLLBACK; (en caso de error)`, note: "BEGIN TRANSACTION — COMMIT (sin 'TRANSACTION')" },
  },
  mongodb: {
    SELECT:      { script: `db.orders\n  .find({ user_id: 42 })\n  .sort({ created_at: -1 })\n  .limit(25)`,                                                                                                                                  note: 'Métodos encadenados, no SQL' },
    INSERT:      { script: `db.audit_log.insertOne({\n  user_id: 42,\n  action: "login",\n  created_at: new Date()\n})`,                                                                                                                      note: 'Inserta un documento JSON' },
    UPDATE:      { script: `db.inventory.updateOne(\n  { product_id: 3 },\n  { $inc: { stock: -1 } }\n)`,                                                                                                                                     note: 'Operador $inc para decrementar' },
    DELETE:      { script: `db.sessions.deleteMany({\n  last_seen: {\n    $lt: new Date(\n      Date.now() - 30*86400000\n    )\n  }\n})`,                                                                                                     note: 'Operador $lt para comparar fechas' },
    TRANSACTION: { script: `const session = client.startSession();\n\nsession.startTransaction();\n\ndb.inventory.updateOne(\n  { product_id: 3 },\n  { $inc: { stock: -1 } },\n  { session }\n);\n\ndb.orders.insertOne(\n  { user_id: 42, product_id: 3,\n    created_at: new Date() },\n  { session }\n);\n\nsession.commitTransaction();\n// session.abortTransaction(); (error)`, note: 'Requiere sesión de cliente — MongoDB 4.0+' },
  },
  redis: {
    SELECT:      { script: `GET session:42`,                                                                                                                                                                                                   note: 'Lectura directa por clave' },
    INSERT:      { script: `SETEX session:42 86400 "active"`,                                                                                                                                                                                  note: 'SETEX: clave con TTL en segundos' },
    UPDATE:      { script: `HINCRBY inventory:3 stock -1`,                                                                                                                                                                                     note: 'HINCRBY: decrementa campo en hash' },
    DELETE:      { script: `DEL session:42`,                                                                                                                                                                                                   note: 'DEL: elimina la clave directamente' },
    TRANSACTION: { script: `MULTI\n\nHINCRBY inventory:3 stock -1\nLPUSH orders:42 "product:3"\nSETEX session:42 86400 "active"\n\nEXEC\n-- DISCARD (cancela sin ejecutar)`,                                                                  note: 'MULTI / EXEC — DISCARD para cancelar' },
  },
}

const QT_STYLES: Record<QueryType, { active: string; dot: string; label: string }> = {
  SELECT:      { active: 'text-blue-400 bg-blue-900/30 border-blue-700/60',         dot: 'bg-blue-400',    label: 'Consultar registros' },
  INSERT:      { active: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/60', dot: 'bg-emerald-400', label: 'Insertar registro' },
  UPDATE:      { active: 'text-amber-400 bg-amber-900/30 border-amber-700/60',       dot: 'bg-amber-400',   label: 'Actualizar registro' },
  DELETE:      { active: 'text-red-400 bg-red-900/30 border-red-700/60',             dot: 'bg-red-400',     label: 'Eliminar registros' },
  TRANSACTION: { active: 'text-violet-400 bg-violet-900/30 border-violet-700/60',    dot: 'bg-violet-400',  label: 'Agrupar operaciones con garantía ACID' },
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Copiar al portapapeles"
      className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-white hover:bg-surface-600 transition-all shrink-0"
    >
      {copied
        ? <Check size={11} className="text-emerald-400" />
        : <Copy size={11} />
      }
    </button>
  )
}

export default function SyntaxComparatorModal({ onClose }: { onClose: () => void }) {
  const [activeType, setActiveType] = useState<QueryType>('SELECT')
  const style = QT_STYLES[activeType]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl bg-surface-900 border border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-surface-800 border-b border-surface-600 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0">
            <GitCompare size={15} className="text-white" />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-bold text-white">Comparador de Sintaxis</div>
            <div className="text-[11px] text-slate-500">El mismo script en los 7 motores — dialecto real de cada uno</div>
          </div>

          {/* Operation tabs */}
          <div className="flex items-center gap-1.5 ml-4">
            {(Object.keys(QT_STYLES) as QueryType[]).map(qt => (
              <button
                key={qt}
                onClick={() => setActiveType(qt)}
                className={`h-7 px-3 rounded-lg text-[11px] font-semibold transition-all border ${
                  activeType === qt
                    ? QT_STYLES[qt].active
                    : 'text-slate-500 bg-surface-700/60 border-surface-600 hover:text-slate-300 hover:bg-surface-700'
                }`}
              >
                {qt}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-surface-600 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Operation context bar ───────────────────────────────────────────── */}
        <div className="px-5 py-2 bg-surface-800/60 border-b border-surface-700/60 shrink-0 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
          <span className="text-[11px] text-slate-400">
            Operación: <span className="text-white font-semibold">{activeType}</span>
            <span className="mx-2 text-slate-600">·</span>
            <span className="text-slate-500">{style.label}</span>
          </span>
          <div className="flex-1" />
          <span className="text-[10px] text-slate-600">Los valores (42, 3) son ejemplos de la simulación de carga</span>
        </div>

        {/* ── Cards grid ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ENGINES.map(eng => {
              const { script, note } = SCRIPTS[eng.key][activeType]
              return (
                <div
                  key={eng.key}
                  className="bg-surface-800 border border-surface-600 rounded-xl overflow-hidden flex flex-col"
                  style={{ borderTopColor: eng.color, borderTopWidth: 3 }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-surface-600 bg-surface-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{eng.emoji}</span>
                      <span className="text-xs font-bold text-white truncate">{eng.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${eng.tagColor}`}>
                        {eng.tag}
                      </span>
                      <CopyButton text={script} />
                    </div>
                  </div>

                  {/* Code block */}
                  <div className="flex-1 p-3 bg-surface-900/70">
                    <pre className="text-[11px] font-mono text-slate-100 leading-[1.65] whitespace-pre-wrap break-words">
                      {script}
                    </pre>
                  </div>

                  {/* Difference note */}
                  <div className="px-3 py-2 border-t border-surface-600/80 bg-surface-700/30 flex items-start gap-1.5">
                    <span className={`mt-0.5 w-1 h-1 rounded-full shrink-0 ${style.dot}`} />
                    <span className="text-[10px] text-slate-400 leading-snug">{note}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Legend ─────────────────────────────────────────────────────────── */}
          <div className="mt-4 p-3.5 bg-surface-800/60 border border-surface-700/60 rounded-xl flex flex-wrap gap-x-6 gap-y-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-full mb-0.5">
              Leyenda de tipos de motor
            </span>
            {[
              { tag: 'SQL',   color: 'text-blue-400 bg-blue-900/30 border-blue-800/40',      desc: 'Lenguaje SQL estándar (MySQL, PostgreSQL, Oracle, SQLite)' },
              { tag: 'T-SQL', color: 'text-blue-400 bg-blue-900/30 border-blue-800/40',      desc: 'Transact-SQL — dialecto de Microsoft SQL Server' },
              { tag: 'NoSQL', color: 'text-emerald-400 bg-emerald-900/30 border-emerald-800/40', desc: 'Documentos JSON — MongoDB Shell' },
              { tag: 'KV',    color: 'text-orange-400 bg-orange-900/30 border-orange-800/40', desc: 'Clave-Valor — comandos Redis' },
            ].map(({ tag, color, desc }) => (
              <div key={tag} className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${color}`}>{tag}</span>
                <span className="text-[10px] text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
