import { useState, useEffect, useCallback } from 'react'
import { Database, Zap, Shield, Layers, ChevronRight, Activity, Server } from 'lucide-react'

interface Session { username: string; role: string; color: string }
interface Props { session: Session; onEnter: () => void }

// ─── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(text: string, speed: number, startDelay: number) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const delay = setTimeout(() => {
      const iv = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) { clearInterval(iv); setDone(true) }
      }, speed)
      return () => clearInterval(iv)
    }, startDelay)
    return () => clearTimeout(delay)
  }, [text, speed, startDelay])

  return { displayed, done }
}

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

const TOTAL_MS = 5500

export default function WelcomeScreen({ session, onEnter }: Props) {
  const [visible,  setVisible]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [entering, setEntering] = useState(false)

  const tw1 = useTypewriter('Bienvenido al Sistema', 55, 700)
  const tw2 = useTypewriter('Simulador de Bases de Datos', 45, tw1.done ? 300 : 99999)

  useEffect(() => { setTimeout(() => setVisible(true), 60) }, [])

  // Auto-countdown
  useEffect(() => {
    if (!visible) return
    const start = Date.now()
    let raf: number
    const tick = () => {
      const pct = Math.min(((Date.now() - start) / TOTAL_MS) * 100, 100)
      setProgress(pct)
      if (pct < 100) { raf = requestAnimationFrame(tick) }
      else { handleEnter() }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const handleEnter = useCallback(() => {
    if (entering) return
    setEntering(true)
    setTimeout(onEnter, 600)
  }, [entering, onEnter])

  const stats = [
    { icon: <Server size={13} />,   label: 'SQL · MongoDB · Redis', color: '#60a5fa' },
    { icon: <Zap size={13} />,      label: 'Motor Multi-Engine',    color: '#a78bfa' },
    { icon: <Shield size={13} />,   label: 'Entorno Seguro',        color: '#34d399' },
    { icon: <Layers size={13} />,   label: 'Esquemas Dinámicos',    color: '#fb923c' },
  ]

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0a0f1e 40%, #070d1e 100%)',
        transition: 'opacity 0.6s ease',
        opacity: entering ? 0 : 1,
      }}
    >
      {/* ── Aurora blobs ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '10%', left: '15%',  width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)', animation: 'blobDrift 12s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '12%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)', animation: 'blobDrift 16s ease-in-out 2s infinite alternate-reverse' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%',  width: 600, height: 300, marginLeft: -300, marginTop: -150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06), transparent 70%)', animation: 'blobDrift 20s ease-in-out 4s infinite alternate' }} />

        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.03 }}>
          <defs>
            <pattern id="wgrid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#94a3b8" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wgrid)" />
        </svg>

        {/* Floating particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 2.5 + 0.5,
            height: Math.random() * 2.5 + 0.5,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ec4899'][i % 5],
            opacity: 0.25,
            animation: `floatPt ${5 + Math.random() * 8}s ease-in-out ${Math.random() * 5}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* ── Main card ────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 620,
          margin: '0 16px',
          transition: 'opacity 0.8s cubic-bezier(.16,1,.3,1), transform 0.8s cubic-bezier(.16,1,.3,1)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.96)',
        }}
      >
        <div style={{
          background: 'rgba(10,15,30,0.75)',
          border: '1px solid rgba(99,102,241,0.22)',
          borderRadius: 24,
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 80px rgba(99,102,241,0.10), 0 40px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}>
          {/* Top gradient bar */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981, #f59e0b)' }} />

          <div style={{ padding: '48px 52px 44px' }}>

            {/* Status badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '5px 14px', borderRadius: 99,
                background: 'rgba(16,185,129,0.10)',
                border: '1px solid rgba(16,185,129,0.25)',
                animation: 'fadeUp 0.5s ease 0.2s both',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block', animation: 'pulseDot 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Sistema Activo</span>
              </div>
            </div>

            {/* DB Icon with orbit rings */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40, position: 'relative', height: 120 }}>
              {/* Orbit rings */}
              {[100, 130, 160].map((sz, idx) => (
                <div key={idx} style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: sz, height: sz,
                  marginLeft: -sz/2, marginTop: -sz/2,
                  borderRadius: '50%',
                  border: `1px solid rgba(99,102,241,${0.22 - idx * 0.06})`,
                  animation: `spin ${8 + idx * 4}s linear infinite ${idx % 2 === 1 ? 'reverse' : ''}`,
                }}>
                  {/* Dot on ring */}
                  <div style={{
                    position: 'absolute', top: -3, left: '50%', marginLeft: -3,
                    width: 6, height: 6, borderRadius: '50%',
                    background: ['#3b82f6','#8b5cf6','#10b981'][idx],
                    boxShadow: `0 0 8px ${['#3b82f6','#8b5cf6','#10b981'][idx]}`,
                  }} />
                </div>
              ))}
              {/* Pulse circles */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -40, marginTop: -40, width: 80, height: 80, borderRadius: '50%', border: '1px solid rgba(99,102,241,0.15)', animation: 'expandRing 3s ease-out infinite' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -40, marginTop: -40, width: 80, height: 80, borderRadius: '50%', border: '1px solid rgba(99,102,241,0.10)', animation: 'expandRing 3s ease-out 1s infinite' }} />
              {/* Icon */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                marginLeft: -32, marginTop: -32,
                width: 64, height: 64, borderRadius: 18,
                background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
                boxShadow: '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'iconPulse 4s ease-in-out infinite',
              }}>
                <Database size={28} color="white" />
              </div>
            </div>

            {/* Typewriter title */}
            <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fadeUp 0.6s ease 0.5s both' }}>
              <div style={{
                fontSize: 30, fontWeight: 800, color: '#f1f5f9',
                letterSpacing: '-0.02em', lineHeight: 1.2, minHeight: 38,
                background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {tw1.displayed}
                {!tw1.done && <span style={{ animation: 'blink 0.8s step-end infinite', WebkitTextFillColor: '#6366f1' }}>|</span>}
              </div>
              <div style={{
                fontSize: 18, fontWeight: 700, marginTop: 6, minHeight: 28,
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {tw2.displayed}
                {tw1.done && !tw2.done && <span style={{ animation: 'blink 0.8s step-end infinite', WebkitTextFillColor: '#8b5cf6' }}>|</span>}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)', marginBottom: 28, animation: 'fadeUp 0.6s ease 0.8s both' }} />

            {/* User info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 20px', borderRadius: 14,
              background: `${session.color}0f`,
              border: `1px solid ${session.color}28`,
              marginBottom: 24,
              animation: 'fadeUp 0.6s ease 1s both',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `linear-gradient(135deg, ${session.color}, ${session.color}99)`,
                boxShadow: `0 0 20px ${session.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0,
              }}>
                {session.username[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                  {session.username.charAt(0).toUpperCase() + session.username.slice(1)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <Activity size={10} color="#10b981" />
                  <span style={{ fontSize: 11, color: '#64748b' }}>Sesión iniciada como</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: session.color,
                    background: `${session.color}18`, border: `1px solid ${session.color}40`,
                    padding: '1px 8px', borderRadius: 99, letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{session.role}</span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>
                {new Date().toLocaleTimeString()}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8,
              marginBottom: 32,
              animation: 'fadeUp 0.6s ease 1.2s both',
            }}>
              {stats.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '10px 6px', borderRadius: 10,
                  background: `${s.color}0a`,
                  border: `1px solid ${s.color}22`,
                  transition: 'all 0.2s',
                }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <span style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.4 }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 20, animation: 'fadeUp 0.6s ease 1.4s both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cargando entorno</span>
                <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, fontFamily: 'monospace' }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(30,41,59,0.8)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)',
                  width: `${progress}%`,
                  transition: 'width 0.1s linear',
                  boxShadow: '0 0 10px rgba(99,102,241,0.6)',
                }} />
              </div>
            </div>

            {/* Enter button */}
            <div style={{ animation: 'fadeUp 0.6s ease 1.6s both' }}>
              <button
                onClick={handleEnter}
                style={{
                  width: '100%', padding: '14px 24px', borderRadius: 14,
                  background: entering
                    ? 'rgba(99,102,241,0.5)'
                    : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  border: 'none', cursor: 'pointer', color: 'white',
                  fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
                  transition: 'all 0.2s',
                  transform: entering ? 'scale(0.98)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (!entering) { e.currentTarget.style.boxShadow = '0 8px 36px rgba(99,102,241,0.65)'; e.currentTarget.style.transform = 'scale(1.015)' }}}
                onMouseLeave={e => { if (!entering) { e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'scale(1)' }}}
              >
                {entering ? (
                  <>
                    <svg className="animate-spin" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Cargando sistema...
                  </>
                ) : (
                  <>
                    Ingresar al Sistema
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Bottom bar */}
          <div style={{
            padding: '10px 52px',
            borderTop: '1px solid rgba(30,41,59,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(7,11,20,0.5)',
          }}>
            <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              v1.6.0 · 2026 · Multi-Engine Database Simulator
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['SQL','MongoDB','Redis'].map(e => (
                <span key={e} style={{ fontSize: 8, fontWeight: 700, color: '#475569', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(71,85,105,0.3)', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.06em' }}>{e}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blobDrift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(40px, 30px) scale(1.08); }
        }
        @keyframes floatPt {
          from { transform: translateY(0) translateX(0); }
          to   { transform: translateY(-24px) translateX(12px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes expandRing {
          0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%,-50%) scale(2.4); opacity: 0; }
        }
        @keyframes iconPulse {
          0%,100% { box-shadow: 0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2); }
          50%      { box-shadow: 0 0 60px rgba(99,102,241,0.7), 0 0 100px rgba(99,102,241,0.3); }
        }
        @keyframes pulseDot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(1.3); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; } 50% { opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
