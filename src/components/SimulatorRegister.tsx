import { useState } from 'react'
import { Activity, User, Zap } from 'lucide-react'

interface Props {
  onRegister: (name: string) => void
}

export default function SimulatorRegister({ onRegister }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Ingresa tu nombre para continuar'); return }
    if (trimmed.length < 2) { setError('Mínimo 2 caracteres'); return }
    onRegister(trimmed)
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-xl shadow-orange-900/40">
            <Activity size={30} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Simulador de Carga</h1>
            <p className="text-slate-400 text-sm mt-1">Bases de Datos — Multi-Motor</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-orange-400" />
            <span className="text-sm font-medium text-slate-300">Identifícate para comenzar</span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                placeholder="Ej: Kevin Vargas"
                autoFocus
                maxLength={40}
                className="bg-surface-700 border border-surface-500 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
              />
              {error && (
                <span className="text-xs text-red-400">{error}</span>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-orange-900/30 active:scale-[0.98]"
            >
              <Zap size={15} />
              Ingresar al Simulador
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Tu actividad será visible en tiempo real para el administrador
        </p>
      </div>
    </div>
  )
}
