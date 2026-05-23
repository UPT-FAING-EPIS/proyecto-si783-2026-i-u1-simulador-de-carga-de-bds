import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Database, Eye, EyeOff, LogIn, User, Lock, AlertCircle,
  Delete, Grid3x3, UserPlus, ArrowLeft, Mail, CheckCircle2,
} from 'lucide-react'
import { isConfigured } from '../lib/firebase'
import {
  registerUser, loginWithUsername, signInWithGoogle,
  createGoogleProfile, sendPasswordReset, checkAndSetAdminSession,
} from '../lib/auth'

// ─── Admin account (local) ────────────────────────────────────────────────────

const ACCOUNTS = [
  { user: 'admin', pass: 'admin123', pin: '3322', role: 'Administrador', color: '#3b82f6' },
]

const SESSION_KEY = 'simulador_bds_session'

const USER_COLORS = ['#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16','#f97316']

function randomColor() { return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)] }

function getFriendlyError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':    return 'Ese correo ya está registrado.'
    case 'auth/invalid-email':           return 'El correo no es válido.'
    case 'auth/weak-password':           return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':      return 'Usuario o contraseña incorrectos.'
    case 'auth/popup-closed-by-user':    return 'Cerraste la ventana de Google. Intenta de nuevo.'
    case 'auth/popup-blocked':           return 'El navegador bloqueó el popup. Permite popups e intenta de nuevo.'
    case 'username-taken':               return 'Ese nombre de usuario ya está en uso.'
    case 'user-not-found':               return 'Usuario no encontrado.'
    case 'firebase-not-configured':      return 'Firebase no está configurado.'
    case 'session-active':               return 'Esta cuenta ya tiene una sesión activa en otro dispositivo.'
    default:                             return 'Ocurrió un error. Intenta de nuevo.'
  }
}

// ─── Google "G" icon ──────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: 'rgba(71,85,105,0.4)' }} />
      <span className="text-xs text-slate-600 select-none">o</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(71,85,105,0.4)' }} />
    </div>
  )
}

// ─── Google button ────────────────────────────────────────────────────────────

function GoogleButton({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200"
      style={{
        background: loading ? 'rgba(30,41,59,0.5)' : 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(71,85,105,0.5)',
        color: loading ? '#475569' : '#e2e8f0',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.border='1px solid rgba(99,102,241,0.5)'; e.currentTarget.style.background='rgba(30,41,59,1)' } }}
      onMouseLeave={e => { e.currentTarget.style.border='1px solid rgba(71,85,105,0.5)'; e.currentTarget.style.background=loading?'rgba(30,41,59,0.5)':'rgba(30,41,59,0.9)' }}
    >
      {loading ? <Spinner/> : <GoogleIcon/>}
      {label}
    </button>
  )
}

// ─── Particles ────────────────────────────────────────────────────────────────

function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="absolute rounded-full opacity-20" style={{
          width: Math.random()*3+1, height: Math.random()*3+1,
          left: `${Math.random()*100}%`, top: `${Math.random()*100}%`,
          background: ['#3b82f6','#8b5cf6','#10b981','#f59e0b'][i%4],
          animation: `float ${4+Math.random()*6}s ease-in-out ${Math.random()*4}s infinite alternate`,
        }}/>
      ))}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
    </div>
  )
}

// ─── PIN Pad ──────────────────────────────────────────────────────────────────

function PinPad({ pin, maxLen, onDigit, onDelete, error }: { pin:string; maxLen:number; onDigit:(d:string)=>void; onDelete:()=>void; error:boolean }) {
  const digits = useMemo(() => {
    const arr = ['0','1','2','3','4','5','6','7','8','9']
    for (let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
    return arr
  }, [])
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        {Array.from({length:maxLen}).map((_,i)=>{const f=i<pin.length;return(
          <div key={i} className="w-3 h-3 rounded-full transition-all duration-200" style={{ background:error?'rgb(239,68,68)':f?'linear-gradient(135deg,#4f46e5,#7c3aed)':'rgba(71,85,105,0.6)', transform:f?'scale(1.2)':'scale(1)', boxShadow:f&&!error?'0 0 8px rgba(99,102,241,0.6)':'none' }}/>
        )})}
      </div>
      <div className="grid grid-cols-3 gap-2 w-full">
        {digits.map(d=>(
          <button key={d} type="button" onClick={()=>pin.length<maxLen&&onDigit(d)} disabled={pin.length>=maxLen}
            className="relative h-12 rounded-xl text-base font-bold text-white transition-all duration-150 active:scale-95 disabled:opacity-40 overflow-hidden group"
            style={{background:'linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.9))',border:'1px solid rgba(99,102,241,0.2)'}}
            onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(79,70,229,0.3),rgba(124,58,237,0.2))';e.currentTarget.style.border='1px solid rgba(99,102,241,0.5)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.9))';e.currentTarget.style.border='1px solid rgba(99,102,241,0.2)'}}
          ><span className="relative z-10">{d}</span><span className="absolute inset-0 opacity-0 group-active:opacity-20 transition-opacity bg-white rounded-xl"/></button>
        ))}
        <div/>
        <button type="button" onClick={onDelete} className="h-12 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 col-span-2"
          style={{background:'linear-gradient(135deg,rgba(127,29,29,0.4),rgba(153,27,27,0.2))',border:'1px solid rgba(239,68,68,0.25)'}}
          onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(185,28,28,0.5),rgba(153,27,27,0.3))';e.currentTarget.style.border='1px solid rgba(239,68,68,0.5)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(127,29,29,0.4),rgba(153,27,27,0.2))';e.currentTarget.style.border='1px solid rgba(239,68,68,0.25)'}}
        ><Delete size={16} className="text-red-400 mr-2"/><span className="text-sm font-bold text-red-400 tracking-wider">BORRAR</span></button>
      </div>
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const iBase = { background:'rgba(30,41,59,0.8)', border:'1px solid rgba(71,85,105,0.6)', color:'#e2e8f0' } as React.CSSProperties
const iFocus = (color: string) => (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.border=`1px solid ${color}`; e.currentTarget.style.boxShadow=`0 0 0 3px ${color}22` }
const iBlur  = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.border='1px solid rgba(71,85,105,0.6)'; e.currentTarget.style.boxShadow='none' }
const Spinner = () => <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
const ErrBox  = ({ msg }: { msg: string }) => <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)'}}><AlertCircle size={13} className="shrink-0"/>{msg}</div>

// ─── Login Screen ─────────────────────────────────────────────────────────────

interface Props {
  onLogin: (user: { username: string; role: string; color: string; uid?: string }) => void
}

export default function LoginScreen({ onLogin }: Props) {
  type Screen = 'login' | 'register' | 'forgot' | 'google-username'
  const [screen,  setScreen]  = useState<Screen>('login')
  const [mode,    setMode]    = useState<'password'|'pin'>('password')
  const [mounted, setMounted] = useState(false)

  // Login
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [pin,      setPin]      = useState('')
  const [pinError, setPinError] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)

  // Register
  const [regUser,    setRegUser]    = useState('')
  const [regEmail,   setRegEmail]   = useState('')
  const [regPass,    setRegPass]    = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regPin,     setRegPin]     = useState('')
  const [regError,   setRegError]   = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regGLoad,   setRegGLoad]   = useState(false)
  const [showRegPass, setShowRegPass] = useState(false)
  const [showRegConf, setShowRegConf] = useState(false)

  // Google pending (after Google auth, before username chosen)
  const [gUid,   setGUid]   = useState('')
  const [gEmail, setGEmail] = useState('')
  const [gUser,  setGUser]  = useState('')
  const [gError, setGError] = useState('')
  const [gSaving, setGSaving] = useState(false)

  // Forgot password
  const [forgotEmail,   setForgotEmail]   = useState('')
  const [forgotError,   setForgotError]   = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent,    setForgotSent]    = useState(false)

  const userRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (pin.length === 4) {
      const found = ACCOUNTS.find(a => a.pin === pin)
      if (found) {
        checkAndSetAdminSession()
          .then(() => {
            const s = { username: found.user, role: found.role, color: found.color, uid: 'admin' }
            if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
            setTimeout(() => onLogin(s), 200)
          })
          .catch(err => {
            setPin('')
            setMode('password')
            setError(getFriendlyError((err as Error).message))
          })
      } else {
        setPinError(true)
        setTimeout(() => { setPin(''); setPinError(false) }, 600)
      }
    }
  }, [pin, remember, onLogin])

  useEffect(() => { setTimeout(() => setMounted(true), 50); userRef.current?.focus() }, [])

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function doLogin(profile: { username: string; role: string; color: string; uid?: string }) {
    if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(profile))
    onLogin(profile)
  }

  function errCode(err: unknown): string {
    return (err as { code?: string })?.code ?? (err as Error)?.message ?? ''
  }

  // ── Login ─────────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!username.trim() || !password.trim()) { setError('Completa todos los campos.'); return }
    setLoading(true)
    const admin = ACCOUNTS.find(a => a.user.toLowerCase() === username.trim().toLowerCase() && a.pass === password)
    if (admin) {
      try {
        await checkAndSetAdminSession()
        doLogin({ username: admin.user, role: admin.role, color: admin.color, uid: 'admin' })
      } catch (err) {
        setLoading(false)
        setError(getFriendlyError(errCode(err)))
      }
      return
    }
    if (!isConfigured) { setLoading(false); setError('Usuario o contraseña incorrectos.'); return }
    try {
      const p = await loginWithUsername(username.trim(), password)
      doLogin({ username: p.username, role: p.role, color: p.color, uid: p.uid })
    } catch (err) { setLoading(false); setError(getFriendlyError(errCode(err))) }
  }

  async function handleGoogleLogin() {
    if (!isConfigured) { setError('Firebase no está configurado.'); return }
    setGLoading(true); setError('')
    try {
      const res = await signInWithGoogle()
      if (!res.isNew && res.profile) {
        doLogin({ username: res.profile.username, role: res.profile.role, color: res.profile.color, uid: res.uid })
      } else {
        setGUid(res.uid); setGEmail(res.googleEmail)
        setScreen('google-username')
        setGLoading(false)
      }
    } catch (err) { setGLoading(false); setError(getFriendlyError(errCode(err))) }
  }

  // ── Register ──────────────────────────────────────────────────────────────────

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setRegError('')
    if (!regUser.trim() || !regEmail.trim() || !regPass || !regConfirm) { setRegError('Completa todos los campos.'); return }
    if (regUser.trim().length < 3)       { setRegError('El usuario debe tener al menos 3 caracteres.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) { setRegError('El correo no es válido.'); return }
    if (regPass.length < 6)              { setRegError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (regPass !== regConfirm)          { setRegError('Las contraseñas no coinciden.'); return }
    if (regPin && !/^\d{4}$/.test(regPin)) { setRegError('El PIN debe ser exactamente 4 dígitos.'); return }
    if (ACCOUNTS.some(a => a.user.toLowerCase() === regUser.trim().toLowerCase())) { setRegError('Ese nombre de usuario ya está en uso.'); return }
    setRegLoading(true)
    try {
      const p = await registerUser({ email: regEmail.trim(), password: regPass, username: regUser.trim(), pin: regPin, color: randomColor() })
      doLogin({ username: p.username, role: p.role, color: p.color, uid: p.uid })
    } catch (err) { setRegLoading(false); setRegError(getFriendlyError(errCode(err))) }
  }

  async function handleGoogleRegister() {
    if (!isConfigured) { setRegError('Firebase no está configurado.'); return }
    setRegGLoad(true); setRegError('')
    try {
      const res = await signInWithGoogle()
      if (!res.isNew && res.profile) {
        doLogin({ username: res.profile.username, role: res.profile.role, color: res.profile.color, uid: res.uid })
      } else {
        setGUid(res.uid); setGEmail(res.googleEmail)
        setScreen('google-username')
        setRegGLoad(false)
      }
    } catch (err) { setRegGLoad(false); setRegError(getFriendlyError(errCode(err))) }
  }

  // ── Google username step ──────────────────────────────────────────────────────

  async function handleGoogleUsername(e: React.FormEvent) {
    e.preventDefault(); setGError('')
    if (!gUser.trim() || gUser.trim().length < 3) { setGError('El usuario debe tener al menos 3 caracteres.'); return }
    if (ACCOUNTS.some(a => a.user.toLowerCase() === gUser.trim().toLowerCase())) { setGError('Ese nombre de usuario ya está en uso.'); return }
    setGSaving(true)
    try {
      const p = await createGoogleProfile({ uid: gUid, email: gEmail, username: gUser.trim(), color: randomColor() })
      doLogin({ username: p.username, role: p.role, color: p.color, uid: p.uid })
    } catch (err) { setGSaving(false); setGError(getFriendlyError(errCode(err))) }
  }

  // ── Forgot password ───────────────────────────────────────────────────────────

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault(); setForgotError('')
    if (!forgotEmail.trim()) { setForgotError('Ingresa tu correo electrónico.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) { setForgotError('El correo no es válido.'); return }
    setForgotLoading(true)
    try {
      await sendPasswordReset(forgotEmail.trim())
      setForgotSent(true)
    } catch {
      // Show success even on error (security best practice — don't reveal if email exists)
      setForgotSent(true)
    } finally { setForgotLoading(false) }
  }

  function goToLogin() {
    setScreen('login'); setError(''); setPin(''); setPinError(false)
    setForgotEmail(''); setForgotError(''); setForgotSent(false)
    setGUid(''); setGEmail(''); setGUser(''); setGError('')
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{background:'linear-gradient(135deg,#0d1117 0%,#0f172a 50%,#0d1117 100%)'}}>
      <Particles/>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{background:'radial-gradient(circle,#3b82f6,transparent)'}}/>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{background:'radial-gradient(circle,#8b5cf6,transparent)'}}/>

      <div className="relative w-full max-w-md mx-4 transition-all duration-700"
        style={{opacity:mounted?1:0,transform:mounted?'translateY(0) scale(1)':'translateY(24px) scale(0.97)'}}>
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{background:'rgba(15,23,42,0.85)',border:'1px solid rgba(99,102,241,0.25)',backdropFilter:'blur(20px)',boxShadow:'0 0 60px rgba(99,102,241,0.12),0 25px 50px rgba(0,0,0,0.6)'}}>
          <div className="h-1 w-full" style={{background:'linear-gradient(90deg,#3b82f6,#8b5cf6,#10b981)'}}/>

          <div className="px-8 py-8">

            {/* ── LOGIN ─────────────────────────────────────────────── */}
            {screen === 'login' && (
              <>
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{background:'linear-gradient(135deg,#1e40af,#7c3aed)',boxShadow:'0 0 30px rgba(99,102,241,0.4)'}}>
                    <Database size={30} className="text-white"/>
                  </div>
                  <h1 className="text-xl font-bold text-white">Simulador de Bases de Datos</h1>
                  <p className="text-sm text-slate-500 mt-1">Multi-Engine Database Simulator</p>
                </div>

                <div className="flex rounded-xl p-1 mb-6" style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(71,85,105,0.4)'}}>
                  {(['password','pin'] as const).map(m => (
                    <button key={m} type="button" onClick={() => { setMode(m); setError(''); setPin(''); setPinError(false) }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={mode===m ? {background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',boxShadow:'0 2px 12px rgba(99,102,241,0.4)'} : {color:'#64748b'}}>
                      {m==='password' ? <><Lock size={12}/> Contraseña</> : <><Grid3x3 size={12}/> PIN</>}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {mode === 'password' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Usuario</label>
                        <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                          <input ref={userRef} type="text" value={username} onChange={e=>{setUsername(e.target.value);setError('')}} placeholder="Ingresa tu usuario" autoComplete="username"
                            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none"
                            style={{...iBase,border:error?'1px solid rgba(239,68,68,0.6)':'1px solid rgba(71,85,105,0.6)'}}
                            onFocus={iFocus('rgba(99,102,241,0.7)')} onBlur={iBlur}/>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Contraseña</label>
                        <div className="relative"><Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                          <input type={showPass?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value);setError('')}} placeholder="Ingresa tu contraseña" autoComplete="current-password"
                            className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none"
                            style={{...iBase,border:error?'1px solid rgba(239,68,68,0.6)':'1px solid rgba(71,85,105,0.6)'}}
                            onFocus={iFocus('rgba(99,102,241,0.7)')} onBlur={iBlur}/>
                          <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                            {showPass?<EyeOff size={14}/>:<Eye size={14}/>}
                          </button>
                        </div>
                        <div className="flex justify-end mt-1">
                          <button type="button" onClick={()=>setScreen('forgot')} className="text-[11px] text-slate-500 hover:text-indigo-400 transition-colors">¿Olvidaste tu contraseña?</button>
                        </div>
                      </div>
                      {error && <ErrBox msg={error}/>}
                      <div className="flex items-center gap-2">
                        <input id="rem" type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer"/>
                        <label htmlFor="rem" className="text-xs text-slate-500 cursor-pointer select-none">Mantener sesión iniciada</label>
                      </div>
                      <button type="submit" disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
                        style={{background:loading?'rgba(99,102,241,0.5)':'linear-gradient(135deg,#4f46e5,#7c3aed)',boxShadow:loading?'none':'0 4px 20px rgba(99,102,241,0.4)',cursor:loading?'not-allowed':'pointer'}}
                        onMouseEnter={e=>{if(!loading)e.currentTarget.style.boxShadow='0 6px 28px rgba(99,102,241,0.6)'}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow=loading?'none':'0 4px 20px rgba(99,102,241,0.4)'}}>
                        {loading?<><Spinner/>Verificando...</>:<><LogIn size={15}/>Iniciar Sesión</>}
                      </button>
                      <Divider/>
                      <GoogleButton label="Continuar con Google" loading={gLoading} onClick={handleGoogleLogin}/>
                    </form>
                  ) : (
                    <div className="transition-all duration-300" style={{animation:'fadeIn 0.2s ease'}}>
                      <p className="text-center text-xs text-slate-500 mb-4">Ingresa tu PIN de <span className="text-indigo-400 font-semibold">4 dígitos</span></p>
                      <PinPad pin={pin} maxLen={4} onDigit={d=>{setPin(p=>p+d);setPinError(false)}} onDelete={()=>setPin(p=>p.slice(0,-1))} error={pinError}/>
                      {pinError && <div className="flex items-center justify-center gap-2 mt-3 text-xs text-red-400"><AlertCircle size={12}/> PIN incorrecto</div>}
                      <div className="flex items-center gap-2 mt-4">
                        <input id="rem-pin" type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer"/>
                        <label htmlFor="rem-pin" className="text-xs text-slate-500 cursor-pointer select-none">Mantener sesión iniciada</label>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs text-slate-500 mt-5">
                  ¿No tienes cuenta?{' '}
                  <button type="button" onClick={()=>{setScreen('register');setError('')}} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Regístrate</button>
                </p>
              </>
            )}

            {/* ── REGISTER ──────────────────────────────────────────── */}
            {screen === 'register' && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg" style={{background:'linear-gradient(135deg,#065f46,#7c3aed)',boxShadow:'0 0 24px rgba(16,185,129,0.3)'}}>
                    <UserPlus size={26} className="text-white"/>
                  </div>
                  <h1 className="text-xl font-bold text-white">Crear cuenta</h1>
                  <p className="text-xs text-slate-500 mt-1">Completa los datos para registrarte</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Usuario</label>
                    <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                      <input type="text" value={regUser} onChange={e=>{setRegUser(e.target.value);setRegError('')}} placeholder="Elige un nombre de usuario" autoComplete="username"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none" style={iBase}
                        onFocus={iFocus('rgba(16,185,129,0.7)')} onBlur={iBlur}/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Correo electrónico</label>
                    <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                      <input type="email" value={regEmail} onChange={e=>{setRegEmail(e.target.value);setRegError('')}} placeholder="tucorreo@gmail.com" autoComplete="email"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none" style={iBase}
                        onFocus={iFocus('rgba(16,185,129,0.7)')} onBlur={iBlur}/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Contraseña</label>
                    <div className="relative"><Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                      <input type={showRegPass?'text':'password'} value={regPass} onChange={e=>{setRegPass(e.target.value);setRegError('')}} placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none" style={iBase}
                        onFocus={iFocus('rgba(16,185,129,0.7)')} onBlur={iBlur}/>
                      <button type="button" onClick={()=>setShowRegPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">{showRegPass?<EyeOff size={14}/>:<Eye size={14}/>}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Confirmar contraseña</label>
                    <div className="relative"><Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                      <input type={showRegConf?'text':'password'} value={regConfirm} onChange={e=>{setRegConfirm(e.target.value);setRegError('')}} placeholder="Repite tu contraseña" autoComplete="new-password"
                        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none" style={iBase}
                        onFocus={iFocus('rgba(16,185,129,0.7)')} onBlur={iBlur}/>
                      <button type="button" onClick={()=>setShowRegConf(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">{showRegConf?<EyeOff size={14}/>:<Eye size={14}/>}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">PIN <span className="text-slate-600 normal-case font-normal">(opcional — 4 dígitos)</span></label>
                    <div className="relative"><Grid3x3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                      <input type="text" inputMode="numeric" maxLength={4} value={regPin} onChange={e=>{setRegPin(e.target.value.replace(/\D/g,'').slice(0,4));setRegError('')}} placeholder="Ej: 1234"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none tracking-widest" style={iBase}
                        onFocus={iFocus('rgba(16,185,129,0.7)')} onBlur={iBlur}/>
                    </div>
                  </div>

                  {regError && <ErrBox msg={regError}/>}

                  <button type="submit" disabled={regLoading}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
                    style={{background:regLoading?'rgba(16,185,129,0.4)':'linear-gradient(135deg,#059669,#7c3aed)',boxShadow:regLoading?'none':'0 4px 20px rgba(16,185,129,0.3)',cursor:regLoading?'not-allowed':'pointer'}}>
                    {regLoading?<><Spinner/>Creando cuenta...</>:<><UserPlus size={15}/>Crear cuenta</>}
                  </button>
                  <Divider/>
                  <GoogleButton label="Registrarse con Google" loading={regGLoad} onClick={handleGoogleRegister}/>
                </form>

                <p className="text-center text-xs text-slate-500 mt-4">
                  ¿Ya tienes cuenta?{' '}
                  <button type="button" onClick={()=>{setScreen('login');setRegError('')}} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors inline-flex items-center gap-1">
                    <ArrowLeft size={11}/> Iniciar Sesión
                  </button>
                </p>
              </>
            )}

            {/* ── GOOGLE USERNAME ────────────────────────────────────── */}
            {screen === 'google-username' && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg" style={{background:'linear-gradient(135deg,#1e3a5f,#7c3aed)',boxShadow:'0 0 24px rgba(59,130,246,0.3)'}}>
                    <GoogleIcon/>
                  </div>
                  <h1 className="text-xl font-bold text-white">Elige tu usuario</h1>
                  <p className="text-xs text-slate-400 mt-1 text-center">
                    Conectado con <span className="text-indigo-400 font-medium">{gEmail}</span>
                  </p>
                </div>
                <form onSubmit={handleGoogleUsername} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Nombre de usuario</label>
                    <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                      <input type="text" value={gUser} onChange={e=>{setGUser(e.target.value);setGError('')}} placeholder="Cómo quieres que te llamen" autoComplete="username"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none" style={iBase}
                        onFocus={iFocus('rgba(99,102,241,0.7)')} onBlur={iBlur} autoFocus/>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">Con este nombre iniciarás sesión siempre.</p>
                  </div>
                  {gError && <ErrBox msg={gError}/>}
                  <button type="submit" disabled={gSaving}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
                    style={{background:gSaving?'rgba(99,102,241,0.4)':'linear-gradient(135deg,#4f46e5,#7c3aed)',boxShadow:gSaving?'none':'0 4px 20px rgba(99,102,241,0.4)',cursor:gSaving?'not-allowed':'pointer'}}>
                    {gSaving?<><Spinner/>Guardando...</>:<>Confirmar y entrar</>}
                  </button>
                </form>
              </>
            )}

            {/* ── FORGOT PASSWORD ────────────────────────────────────── */}
            {screen === 'forgot' && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                    style={{background:forgotSent?'linear-gradient(135deg,#065f46,#0891b2)':'linear-gradient(135deg,#92400e,#7c3aed)',boxShadow:forgotSent?'0 0 24px rgba(16,185,129,0.3)':'0 0 24px rgba(245,158,11,0.25)'}}>
                    {forgotSent ? <CheckCircle2 size={26} className="text-white"/> : <Mail size={26} className="text-white"/>}
                  </div>
                  <h1 className="text-xl font-bold text-white">{forgotSent?'¡Correo enviado!':'Recuperar contraseña'}</h1>
                  <p className="text-xs text-slate-500 mt-1">{forgotSent?'Revisa tu bandeja de entrada':'Ingresa el correo de tu cuenta'}</p>
                </div>

                {!forgotSent ? (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Correo electrónico</label>
                      <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                        <input type="email" value={forgotEmail} onChange={e=>{setForgotEmail(e.target.value);setForgotError('')}} placeholder="El correo con que te registraste"
                          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border transition-all duration-200 outline-none" style={iBase}
                          onFocus={iFocus('rgba(245,158,11,0.7)')} onBlur={iBlur}/>
                      </div>
                    </div>
                    {forgotError && <ErrBox msg={forgotError}/>}
                    <button type="submit" disabled={forgotLoading}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200"
                      style={{background:forgotLoading?'rgba(245,158,11,0.4)':'linear-gradient(135deg,#b45309,#7c3aed)',boxShadow:forgotLoading?'none':'0 4px 20px rgba(245,158,11,0.25)',cursor:forgotLoading?'not-allowed':'pointer'}}>
                      {forgotLoading?<><Spinner/>Enviando...</>:'Enviar link de recuperación'}
                    </button>
                  </form>
                ) : (
                  <div className="px-4 py-4 rounded-xl text-center" style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)'}}>
                    <p className="text-sm text-slate-300">Te enviamos un enlace a</p>
                    <p className="text-base font-bold text-emerald-400 mt-1 break-all">{forgotEmail}</p>
                    <p className="text-xs text-slate-500 mt-3">Haz clic en el enlace para crear una nueva contraseña. <span className="text-amber-400">Expira en 1 hora.</span></p>
                  </div>
                )}

                <p className="text-center text-xs text-slate-500 mt-5">
                  <button type="button" onClick={goToLogin} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors inline-flex items-center gap-1">
                    <ArrowLeft size={11}/> Volver al inicio de sesión
                  </button>
                </p>
              </>
            )}

          </div>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-4">v1.8.0 · Multi-Engine Database Simulator · 2026</p>
      </div>

      <style>{`
        @keyframes float { from{transform:translateY(0px) translateX(0px)} to{transform:translateY(-20px) translateX(10px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}

export { SESSION_KEY, ACCOUNTS }
export type { Props as LoginProps }
