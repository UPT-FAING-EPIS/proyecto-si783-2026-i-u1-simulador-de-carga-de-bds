import { useState } from 'react'
import { Shield, Chrome, AlertCircle } from 'lucide-react'
import { signInWithGoogle } from '../lib/auth'

interface Props {
  onAuth: (email: string) => void
}

export default function AdminLogin({ onAuth }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleGoogle() {
    setLoading(true)
    setError('')
    try {
      const result = await signInWithGoogle()
      onAuth(result.googleEmail)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'session-active') {
        setError('Esta cuenta ya tiene una sesión activa.')
      } else if (msg.includes('popup-closed')) {
        setError('Cerraste la ventana antes de iniciar sesión.')
      } else {
        setError('No se pudo iniciar sesión. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-900/40">
            <Shield size={30} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Panel Docente</h1>
            <p className="text-slate-400 text-sm mt-1">Monitoreo en tiempo real</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <p className="text-sm text-slate-400 text-center">
            Acceso exclusivo para docentes autorizados
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-300">{error}</span>
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Chrome size={18} className="text-slate-700" />
            )}
            {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
          </button>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Solo cuentas autorizadas por el administrador tienen acceso
        </p>
      </div>
    </div>
  )
}
