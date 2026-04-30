import { X, Keyboard, BookOpen, Zap } from 'lucide-react'

interface Props { onClose: () => void }

const SHORTCUTS = [
  { keys: ['Ctrl', 'Enter'], desc: 'Ejecutar consulta', category: 'Ejecución' },
  { keys: ['F5'], desc: 'Ejecutar consulta', category: 'Ejecución' },
  { keys: ['Ctrl', '/'], desc: 'Comentar / descomentar línea', category: 'Editor' },
  { keys: ['Ctrl', 'Z'], desc: 'Deshacer', category: 'Editor' },
  { keys: ['Ctrl', 'Y'], desc: 'Rehacer', category: 'Editor' },
  { keys: ['Ctrl', 'A'], desc: 'Seleccionar todo', category: 'Editor' },
  { keys: ['Ctrl', 'D'], desc: 'Duplicar línea', category: 'Editor' },
  { keys: ['Alt', '↑/↓'], desc: 'Mover línea arriba/abajo', category: 'Editor' },
  { keys: ['Ctrl', 'Space'], desc: 'Activar autocompletado', category: 'Editor' },
  { keys: ['Ctrl', 'F'], desc: 'Buscar en editor', category: 'Editor' },
  { keys: ['Ctrl', 'H'], desc: 'Buscar y reemplazar', category: 'Editor' },
  { keys: ['Tab'], desc: 'Indentar selección', category: 'Formato' },
  { keys: ['Shift', 'Tab'], desc: 'Quitar indentación', category: 'Formato' },
]

const SQL_TIPS = [
  { label: 'SELECT básico', code: 'SELECT * FROM tabla WHERE condición' },
  { label: 'JOIN múltiple', code: 'SELECT a.col FROM a INNER JOIN b ON a.id = b.id' },
  { label: 'Agrupación', code: 'SELECT col, COUNT(*) FROM tabla GROUP BY col' },
  { label: 'Subconsulta', code: 'SELECT * FROM tabla WHERE id IN (SELECT id FROM otra)' },
  { label: 'Crear tabla', code: 'CREATE TABLE nombre (id INT, col VARCHAR)' },
  { label: 'Insertar datos', code: "INSERT INTO tabla (col1) VALUES ('valor')" },
]

const categories = [...new Set(SHORTCUTS.map(s => s.category))]

export default function HelpModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[620px] max-h-[80vh] bg-surface-800 border border-surface-500 rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-600 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-700 flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Ayuda y Referencia</h2>
              <p className="text-[10px] text-slate-400">Atajos de teclado y guía rápida</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-600 text-slate-400 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-0 divide-x divide-surface-700">

            {/* Left: shortcuts */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Keyboard size={14} className="text-violet-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Atajos de teclado</span>
              </div>

              {categories.map(cat => (
                <div key={cat} className="mb-4">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{cat}</div>
                  <div className="space-y-1.5">
                    {SHORTCUTS.filter(s => s.category === cat).map((s, i) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-300">{s.desc}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {s.keys.map((k, j) => (
                            <span key={j}>
                              <kbd className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-surface-600 border border-surface-400 rounded text-slate-200">{k}</kbd>
                              {j < s.keys.length - 1 && <span className="text-slate-600 text-[10px] mx-0.5">+</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: SQL tips */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Guía rápida SQL</span>
              </div>

              <div className="space-y-2.5">
                {SQL_TIPS.map((tip, i) => (
                  <div key={i} className="rounded-lg bg-surface-700 border border-surface-600 overflow-hidden">
                    <div className="px-3 py-1.5 bg-surface-600 border-b border-surface-500">
                      <span className="text-[10px] font-semibold text-slate-300">{tip.label}</span>
                    </div>
                    <pre className="px-3 py-2 text-[11px] text-blue-300 font-mono overflow-x-auto whitespace-pre-wrap">{tip.code}</pre>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/40 rounded-lg">
                <p className="text-xs text-blue-300 font-semibold mb-1">💡 Consejo</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Puedes importar tus propias tablas desde el botón <strong className="text-white">Importar</strong> — CSV, JSON o SQL. Las tablas persisten entre sesiones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
