import { useState, useRef, useEffect } from 'react'
import { Plus, Check, Trash2, ChevronDown, Globe } from 'lucide-react'
import { useStore } from '../../store/useStore'

const PRESET_ENVS = ['Desarrollo', 'Staging', 'Producción']

export default function EnvModal({ onClose }: { onClose: () => void }) {
  const { environment, setEnvironment } = useStore()
  const [envs, setEnvs] = useState<string[]>(() => {
    const saved = localStorage.getItem('simulador_envs')
    return saved ? JSON.parse(saved) : PRESET_ENVS
  })
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function saveEnvs(list: string[]) {
    setEnvs(list)
    localStorage.setItem('simulador_envs', JSON.stringify(list))
  }

  function handleSelect(env: string) { setEnvironment(env); onClose() }

  function handleCreate() {
    const n = newName.trim()
    if (!n || envs.includes(n)) return
    saveEnvs([...envs, n])
    setEnvironment(n)
    setNewName('')
    setCreating(false)
    onClose()
  }

  function handleDelete(env: string) {
    const next = envs.filter(e => e !== env)
    saveEnvs(next)
    if (environment === env) setEnvironment(next[0] ?? 'Desarrollo')
  }

  return (
    <div ref={ref} className="absolute top-full left-0 mt-2 w-60 bg-surface-700 border border-surface-500 rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-surface-600">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Globe size={12} className="text-blue-400" />
          Entornos
        </div>
      </div>

      <div className="py-1 max-h-56 overflow-y-auto">
        {envs.map(env => (
          <div
            key={env}
            className={`flex items-center gap-2 px-3 py-2 transition-colors group ${
              env === environment ? 'bg-blue-600/20' : 'hover:bg-surface-600'
            }`}
          >
            <button onClick={() => handleSelect(env)} className="flex items-center gap-2.5 flex-1 text-left">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${env === environment ? 'bg-blue-400' : 'bg-surface-400'}`} />
              <span className={`text-sm ${env === environment ? 'text-white font-semibold' : 'text-slate-300'}`}>{env}</span>
            </button>
            {env === environment && <Check size={12} className="text-blue-400 shrink-0" />}
            {!PRESET_ENVS.includes(env) && (
              <button
                onClick={() => handleDelete(env)}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-red-600/30 text-slate-500 hover:text-red-400 transition-all"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-surface-600 p-2">
        {creating ? (
          <div className="flex gap-1.5">
            <input
              ref={inputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
              placeholder="Nombre del entorno..."
              className="flex-1 bg-surface-600 border border-surface-400 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
            />
            <button onClick={handleCreate} className="px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">OK</button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-400 hover:text-white hover:bg-surface-600 rounded-lg transition-colors"
          >
            <Plus size={13} className="text-blue-400" />
            Crear nuevo entorno
          </button>
        )}
      </div>
    </div>
  )
}

export function EnvButton() {
  const { environment } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-600 hover:bg-surface-500 text-slate-300 hover:text-white rounded-md transition-colors border border-surface-500"
      >
        <Plus size={13} className="text-blue-400" />
        <span className="hidden md:inline">Entorno: </span>
        <span className="font-semibold text-white">{environment}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <EnvModal onClose={() => setOpen(false)} />}
    </div>
  )
}
