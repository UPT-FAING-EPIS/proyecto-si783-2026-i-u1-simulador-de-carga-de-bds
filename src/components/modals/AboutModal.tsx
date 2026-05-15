import { X, Database, Code2, Layers } from 'lucide-react'

interface Props { onClose: () => void }

const ENGINES = [
  { name: 'SQL Server', color: '#0078d4' },
  { name: 'MySQL',      color: '#f29111' },
  { name: 'PostgreSQL', color: '#336791' },
  { name: 'SQLite',     color: '#44b0ff' },
  { name: 'Oracle',     color: '#c74634' },
  { name: 'MongoDB',    color: '#47a248' },
  { name: 'Redis',      color: '#dc382d' },
]

const TECH_STACK = [
  { name: 'React 18',       desc: 'UI framework',               color: '#61dafb' },
  { name: 'TypeScript',     desc: 'Tipado estático',            color: '#3178c6' },
  { name: 'alasql',         desc: 'Motor SQL en memoria',       color: '#f59e0b' },
  { name: 'Monaco Editor',  desc: 'Editor con intellisense',    color: '#0e7a0d' },
  { name: 'Vite',           desc: 'Build tool',                 color: '#646cff' },
  { name: 'Tailwind CSS',   desc: 'Estilos utilitarios',        color: '#38bdf8' },
  { name: 'IndexedDB',      desc: 'Almacenamiento persistente', color: '#a855f7' },
  { name: 'SheetJS',        desc: 'Exportación a Excel',        color: '#217346' },
]

export default function AboutModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[500px] bg-surface-800 border border-surface-500 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-600">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-700 flex items-center justify-center">
              <Database size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Acerca del simulador</h2>
              <p className="text-[10px] text-slate-400">Información del sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-600 text-slate-400 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* App identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
              <Database size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Simulador de Bases de Datos</h3>
              <p className="text-xs text-slate-400 mt-0.5">Multi-Engine Database Simulator</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-blue-900/40 text-blue-300 border border-blue-700/40 px-2 py-0.5 rounded-full font-mono">v1.6.0</span>
                <span className="text-[10px] text-slate-500">7 motores soportados</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-surface-700 rounded-lg p-3.5 border border-surface-600">
            <p className="text-xs text-slate-300 leading-relaxed">
              Plataforma educativa para aprender y practicar SQL en múltiples motores de bases de datos
              directamente en el navegador, sin instalaciones ni configuraciones. Importa tu esquema,
              ejecuta consultas y exporta los resultados en el formato de cada motor.
            </p>
          </div>

          {/* Engines */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Layers size={11} /> Motores soportados
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {ENGINES.map(e => (
                <div key={e.name} className="flex items-center gap-1.5 bg-surface-700 rounded-md px-2 py-1.5 border border-surface-600">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.color }} />
                  <span className="text-[10px] text-slate-300 truncate">{e.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Code2 size={11} /> Stack tecnológico
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TECH_STACK.map(t => (
                <div key={t.name} className="flex items-center gap-2 bg-surface-700 rounded-md px-2.5 py-2 border border-surface-600">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                  <div>
                    <div className="text-[11px] text-slate-200 font-medium">{t.name}</div>
                    <div className="text-[10px] text-slate-500">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
