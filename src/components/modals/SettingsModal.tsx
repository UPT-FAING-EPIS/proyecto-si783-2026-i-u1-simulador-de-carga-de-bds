import { useState } from 'react'
import { X, Monitor, Code2, SlidersHorizontal, Palette } from 'lucide-react'
import { useStore } from '../../store/useStore'

interface Props { onClose: () => void }

type Section = 'apariencia' | 'editor' | 'simulacion' | 'avanzado'

const SECTIONS = [
  { id: 'apariencia' as Section, icon: <Palette size={14} />, label: 'Apariencia' },
  { id: 'editor' as Section, icon: <Code2 size={14} />, label: 'Editor' },
  { id: 'simulacion' as Section, icon: <SlidersHorizontal size={14} />, label: 'Simulación' },
  { id: 'avanzado' as Section, icon: <Monitor size={14} />, label: 'Avanzado' },
]

const EDITOR_THEMES = [
  { value: 'vs-dark', label: 'VS Dark (por defecto)' },
  { value: 'hc-black', label: 'High Contrast' },
  { value: 'light', label: 'Claro' },
]

const FONT_FAMILIES = [
  'JetBrains Mono',
  'Fira Code',
  'Consolas',
  'Cascadia Code',
  'Source Code Pro',
  'Monaco',
]

export default function SettingsModal({ onClose }: Props) {
  const store = useStore()
  const [activeSection, setActiveSection] = useState<Section>('apariencia')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const Row = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-surface-700 last:border-0">
      <div>
        <div className="text-sm text-white">{label}</div>
        {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
      </div>
      <div className="ml-4 shrink-0">{children}</div>
    </div>
  )

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[640px] h-[480px] bg-surface-800 border border-surface-500 rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-600 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-600 flex items-center justify-center">
              <SlidersHorizontal size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Configuración</h2>
              <p className="text-[10px] text-slate-400">Personaliza el simulador</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-600 text-slate-400 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[160px] border-r border-surface-600 py-2 shrink-0">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  activeSection === s.id ? 'bg-surface-600 text-white font-medium border-r-2 border-blue-500' : 'text-slate-400 hover:text-white hover:bg-surface-700'
                }`}
              >
                <span className={activeSection === s.id ? 'text-blue-400' : ''}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">

            {activeSection === 'apariencia' && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Apariencia</h3>
                <Row label="Modo oscuro" hint="Tema oscuro para el simulador">
                  <Toggle checked={store.darkMode} onChange={store.toggleDarkMode} />
                </Row>
                <Row label="Autocommit" hint="Confirmar transacciones automáticamente">
                  <Toggle checked={store.autocommit} onChange={() => store.toggleAutocommit()} />
                </Row>
              </div>
            )}

            {activeSection === 'editor' && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Editor SQL</h3>
                <Row label="Tamaño de fuente" hint="Tamaño del texto en el editor">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => store.setEditorFontSize(Math.max(10, store.editorFontSize - 1))}
                      className="w-6 h-6 flex items-center justify-center rounded bg-surface-600 hover:bg-surface-500 text-slate-300 text-sm font-bold"
                    >−</button>
                    <span className="w-8 text-center text-sm font-mono text-white">{store.editorFontSize}</span>
                    <button
                      onClick={() => store.setEditorFontSize(Math.min(24, store.editorFontSize + 1))}
                      className="w-6 h-6 flex items-center justify-center rounded bg-surface-600 hover:bg-surface-500 text-slate-300 text-sm font-bold"
                    >+</button>
                  </div>
                </Row>
                <Row label="Tema del editor" hint="Color del editor de código">
                  <select
                    value={store.editorTheme}
                    onChange={e => store.setEditorTheme(e.target.value)}
                    className="text-sm"
                  >
                    {EDITOR_THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Row>
                <Row label="Familia de fuente" hint="Tipografía monoespaciada">
                  <select
                    value={store.editorFontFamily}
                    onChange={e => store.setEditorFontFamily(e.target.value)}
                    className="text-sm"
                  >
                    {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Row>
                <Row label="Word wrap" hint="Ajuste de texto largo">
                  <Toggle
                    checked={store.editorWordWrap}
                    onChange={v => store.setEditorWordWrap(v)}
                  />
                </Row>
                <Row label="Números de línea" hint="Mostrar numeración">
                  <Toggle
                    checked={store.editorLineNumbers}
                    onChange={v => store.setEditorLineNumbers(v)}
                  />
                </Row>
              </div>
            )}

            {activeSection === 'simulacion' && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Simulación de Red</h3>
                <Row label="Latencia de red" hint="Retraso artificial en ms (0–5000)">
                  <input
                    type="number" min="0" max="5000"
                    value={store.simulation.networkLatency}
                    onChange={e => store.setSimulation({ networkLatency: +e.target.value })}
                    style={{ width: 80 }}
                  />
                </Row>
                <Row label="Límite de conexiones" hint="Máximo de conexiones simultáneas">
                  <input
                    type="number" min="1" max="1000"
                    value={store.simulation.connectionLimit}
                    onChange={e => store.setSimulation({ connectionLimit: +e.target.value })}
                    style={{ width: 80 }}
                  />
                </Row>
                <Row label="Simular errores aleatorios" hint="Genera fallos según probabilidad">
                  <Toggle checked={store.simulation.simulateErrors} onChange={v => store.setSimulation({ simulateErrors: v })} />
                </Row>
                <Row label="Probabilidad de error (%)" hint="0 = sin errores, 100 = siempre falla">
                  <input
                    type="number" min="0" max="100"
                    value={store.simulation.errorProbability}
                    onChange={e => store.setSimulation({ errorProbability: +e.target.value })}
                    style={{ width: 80 }}
                    disabled={!store.simulation.simulateErrors}
                  />
                </Row>
                <Row label="Nivel de aislamiento" hint="Comportamiento de transacciones">
                  <select
                    value={store.simulation.isolationLevel}
                    onChange={e => store.setSimulation({ isolationLevel: e.target.value as any })}
                    className="text-sm"
                  >
                    {['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'].map(l =>
                      <option key={l} value={l}>{l}</option>
                    )}
                  </select>
                </Row>
              </div>
            )}

            {activeSection === 'avanzado' && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Avanzado</h3>
                <Row label="Limpiar localStorage" hint="Elimina tablas y configuración guardada">
                  <button
                    onClick={() => { if (confirm('¿Limpiar todos los datos guardados?')) { localStorage.clear(); window.location.reload() } }}
                    className="px-3 py-1.5 text-xs bg-red-800/50 hover:bg-red-700/60 text-red-300 hover:text-red-200 rounded-lg border border-red-800/50 transition-colors"
                  >
                    Limpiar todo
                  </button>
                </Row>
                <Row label="Versión" hint="Simulador de Bases de Datos">
                  <span className="text-sm font-mono text-slate-400">v1.6.0</span>
                </Row>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-surface-600 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors">Cancelar</button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
          >
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
