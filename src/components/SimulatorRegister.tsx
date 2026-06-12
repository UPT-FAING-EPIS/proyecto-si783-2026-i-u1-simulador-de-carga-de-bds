import { useState } from 'react'
import { Activity, ArrowRight, Database, Zap, Users } from 'lucide-react'

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
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.08) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">

        {/* Back to landing */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 bg-surface-800 border border-surface-600 hover:bg-surface-700 hover:text-white hover:border-surface-500 transition-all group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 group-hover:-translate-x-0.5 transition-transform">
              <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
            </svg>
            Volver al inicio
          </a>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center gap-5 mb-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #ea580c, #dc2626)' }}>
              <Activity size={36} className="text-white" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-surface-900 flex items-center justify-center">
              <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Simulador de Carga</h1>
            <p className="text-slate-400 text-sm mt-1.5">Prueba de rendimiento en bases de datos · Multi-Motor</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <Database size={14} />, value: '7', label: 'Motores BD' },
            { icon: <Zap size={14} />,      value: '1K+', label: 'TPS máx.' },
            { icon: <Users size={14} />,    value: '200', label: 'Usuarios sim.' },
          ].map(s => (
            <div key={s.label}
              className="bg-surface-800 border border-surface-600 rounded-xl p-3 flex flex-col items-center gap-1.5 text-center">
              <span className="text-orange-400">{s.icon}</span>
              <span className="text-white font-bold text-lg leading-none">{s.value}</span>
              <span className="text-slate-500 text-xs">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-7 shadow-2xl">
          <p className="text-slate-300 text-sm font-medium mb-5">
            Tu sesión será monitoreada en tiempo real. Se registrará el motor, TPS, latencia y actividad.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                placeholder="Ej: Kevin Vargas"
                autoFocus
                maxLength={40}
                className="bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-orange-500 transition-colors text-sm"
              />
              {error && <span className="text-xs text-red-400">{error}</span>}
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98] group"
              style={{ background: 'linear-gradient(135deg, #ea580c, #dc2626)' }}
            >
              <Zap size={15} />
              Comenzar simulación
              <ArrowRight size={15} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs text-slate-500">
            Actividad visible en tiempo real para el administrador
          </p>
        </div>
      </div>
    </div>
  )
}
