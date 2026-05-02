import { useState, useEffect, useRef, useMemo } from 'react'
import { Database, Eye, EyeOff, LogIn, User, Lock, AlertCircle, Delete, Grid3x3 } from 'lucide-react'

// ─── Demo accounts ────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { user: 'admin', pass: 'admin123', pin: '3322', role: 'Administrador', color: '#3b82f6' },
]

const SESSION_KEY = 'simulador_bds_session'

// ─── Animated background particles ───────────────────────────────────────────

function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][i % 4],
            animation: `float ${4 + Math.random() * 6}s ease-in-out ${Math.random() * 4}s infinite alternate`,
          }}
        />
      ))}
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

// ─── Login screen ─────────────────────────────────────────────────────────────

// ─── PIN Pad ──────────────────────────────────────────────────────────────────

interface PinPadProps {
  pin: string
  maxLen: number
  onDigit: (d: string) => void
  onDelete: () => void
  error: boolean
}

function PinPad({ pin, maxLen, onDigit, onDelete, error }: PinPadProps) {
  // Shuffle digits once per mount for security
  const digits = useMemo(() => {
    const arr = ['0','1','2','3','4','5','6','7','8','9']
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* PIN dots indicator */}
      <div className="flex items-center gap-3">
        {Array.from({ length: maxLen }).map((_, i) => {
          const filled = i < pin.length
          return (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all duration-200"
              style={{
                background: error
                  ? 'rgb(239,68,68)'
                  : filled
                    ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                    : 'rgba(71,85,105,0.6)',
                transform: filled ? 'scale(1.2)' : 'scale(1)',
                boxShadow: filled && !error ? '0 0 8px rgba(99,102,241,0.6)' : 'none',
              }}
            />
          )
        })}
      </div>

      {/* Keypad grid */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {digits.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => pin.length < maxLen && onDigit(d)}
            disabled={pin.length >= maxLen}
            className="relative h-12 rounded-xl text-base font-bold text-white transition-all duration-150 active:scale-95 disabled:opacity-40 overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(124,58,237,0.2))'
              e.currentTarget.style.border = '1px solid rgba(99,102,241,0.5)'
              e.currentTarget.style.boxShadow = '0 0 12px rgba(99,102,241,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))'
              e.currentTarget.style.border = '1px solid rgba(99,102,241,0.2)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <span className="relative z-10">{d}</span>
            {/* Ripple shine */}
            <span className="absolute inset-0 opacity-0 group-active:opacity-20 transition-opacity bg-white rounded-xl" />
          </button>
        ))}

        {/* Empty + Delete row */}
        <div />
        <button
          type="button"
          onClick={onDelete}
          className="h-12 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 col-span-2"
          style={{
            background: 'linear-gradient(135deg, rgba(127,29,29,0.4), rgba(153,27,27,0.2))',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(185,28,28,0.5), rgba(153,27,27,0.3))'
            e.currentTarget.style.border = '1px solid rgba(239,68,68,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(127,29,29,0.4), rgba(153,27,27,0.2))'
            e.currentTarget.style.border = '1px solid rgba(239,68,68,0.25)'
          }}
        >
          <Delete size={16} className="text-red-400 mr-2" />
          <span className="text-sm font-bold text-red-400 tracking-wider">BORRAR</span>
        </button>
      </div>
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

interface Props {
  onLogin: (user: { username: string; role: string; color: string }) => void
}

export default function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<'password' | 'pin'>('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const userRef = useRef<HTMLInputElement>(null)

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === 4) {
      const found = ACCOUNTS.find(a => a.pin === pin)
      if (found) {
        const session = { username: found.user, role: found.role, color: found.color }
        if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        setTimeout(() => onLogin(session), 200)
      } else {
        setPinError(true)
        setTimeout(() => { setPin(''); setPinError(false) }, 600)
      }
    }
  }, [pin, remember, onLogin])

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setMounted(true), 50)
    userRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Completa todos los campos.')
      return
    }
    setLoading(true)
    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 800))
    const found = ACCOUNTS.find(
      a => a.user.toLowerCase() === username.trim().toLowerCase() && a.pass === password
    )
    if (!found) {
      setLoading(false)
      setError('Usuario o contraseña incorrectos.')
      return
    }
    const session = { username: found.user, role: found.role, color: found.color }
    if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    onLogin(session)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0f172a 50%, #0d1117 100%)' }}>
      <Particles />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

      {/* Card */}
      <div
        className="relative w-full max-w-md mx-4 transition-all duration-700"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(15,23,42,0.85)',
            border: '1px solid rgba(99,102,241,0.25)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 25px 50px rgba(0,0,0,0.6)',
          }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)' }} />

          <div className="px-8 py-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
                  boxShadow: '0 0 30px rgba(99,102,241,0.4)',
                }}
              >
                <Database size={30} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Simulador de Bases de Datos</h1>
              <p className="text-sm text-slate-500 mt-1">Multi-Engine Database Simulator</p>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(71,85,105,0.4)' }}>
              {(['password', 'pin'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(''); setPin(''); setPinError(false) }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={mode === m ? {
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#fff',
                    boxShadow: '0 2px 12px rgba(99,102,241,0.4)',
                  } : { color: '#64748b' }}
                >
                  {m === 'password' ? <><Lock size={12} /> Contraseña</> : <><Grid3x3 size={12} /> PIN</>}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {mode === 'password' ? (
                <>
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Usuario</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        ref={userRef}
                        type="text"
                        value={username}
                        onChange={e => { setUsername(e.target.value); setError('') }}
                        placeholder="Ingresa tu usuario"
                        autoComplete="username"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none"
                        style={{ background: 'rgba(30,41,59,0.8)', border: error ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(71,85,105,0.6)', color: '#e2e8f0' }}
                        onFocus={e => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.7)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)' }}
                        onBlur={e => { e.currentTarget.style.border = error ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(71,85,105,0.6)'; e.currentTarget.style.boxShadow = 'none' }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Contraseña</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError('') }}
                        placeholder="Ingresa tu contraseña"
                        autoComplete="current-password"
                        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none"
                        style={{ background: 'rgba(30,41,59,0.8)', border: error ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(71,85,105,0.6)', color: '#e2e8f0' }}
                        onFocus={e => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.7)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)' }}
                        onBlur={e => { e.currentTarget.style.border = error ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(71,85,105,0.6)'; e.currentTarget.style.boxShadow = 'none' }}
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertCircle size={13} className="shrink-0" />{error}
                    </div>
                  )}
                </>
              ) : (
                /* PIN mode */
                <div
                  className="transition-all duration-300"
                  style={{ animation: 'fadeIn 0.2s ease' }}
                >
                  <p className="text-center text-xs text-slate-500 mb-4">
                    Ingresa tu PIN de <span className="text-indigo-400 font-semibold">4 dígitos</span>
                  </p>
                  <PinPad
                    pin={pin}
                    maxLen={4}
                    onDigit={d => { setPin(p => p + d); setPinError(false) }}
                    onDelete={() => setPin(p => p.slice(0, -1))}
                    error={pinError}
                  />
                  {pinError && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-red-400">
                      <AlertCircle size={12} /> PIN incorrecto
                    </div>
                  )}
                </div>
              )}

              {/* Remember me + Submit (password mode only) */}
              {mode === 'password' && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-xs text-slate-500 cursor-pointer select-none">
                      Mantener sesión iniciada
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                    style={{
                      background: loading
                        ? 'rgba(99,102,241,0.5)'
                        : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transform: loading ? 'scale(0.99)' : 'scale(1)',
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.6)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)' }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Verificando...
                      </>
                    ) : (
                      <>
                        <LogIn size={15} />
                        Iniciar Sesión
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Remember me for PIN mode */}
              {mode === 'pin' && (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="remember-pin"
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="remember-pin" className="text-xs text-slate-500 cursor-pointer select-none">
                    Mantener sesión iniciada
                  </label>
                </div>
              )}
            </form>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-600 mt-4">
          v1.1.0 · Multi-Engine Database Simulator · 2026
        </p>
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) translateX(0px); }
          to   { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export { SESSION_KEY, ACCOUNTS }
export type { Props as LoginProps }
