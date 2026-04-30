import { useEffect, useRef, useCallback, useState } from 'react'
import { useStore } from './store/useStore'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import EngineTabs from './components/EngineTabs'
import ConnectionBar from './components/ConnectionBar'
import SQLEditor from './components/SQLEditor'
import ResultsPanel from './components/ResultsPanel'
import SchemaExplorer from './components/SchemaExplorer'
import LoginScreen, { SESSION_KEY } from './components/LoginScreen'
import WelcomeScreen from './components/WelcomeScreen'
import { initializeDatabase } from './engines/sqlEngine'

// ─── Resize hook ──────────────────────────────────────────────────────────────

function useResize(initial: number, min: number, max: number, dir: 'h' | 'v', invert = false) {
  const [size, setSize] = useState(initial)
  const sizeRef = useRef(initial)
  sizeRef.current = size

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startPos = dir === 'h' ? e.clientX : e.clientY
    const startSize = sizeRef.current

    const onMove = (ev: MouseEvent) => {
      const raw = (dir === 'h' ? ev.clientX : ev.clientY) - startPos
      const delta = invert ? -raw : raw
      setSize(Math.max(min, Math.min(max, startSize + delta)))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = dir === 'h' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [min, max, dir, invert])

  return { size, startDrag }
}

// ─── Drag handle ─────────────────────────────────────────────────────────────

function Handle({ dir, onMouseDown }: {
  dir: 'h' | 'v'
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const isH = dir === 'h'
  return (
    <div
      onMouseDown={onMouseDown}
      className={[
        'group shrink-0 flex items-center justify-center',
        'bg-surface-600 hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors z-10',
        isH ? 'w-1.5 h-full cursor-col-resize' : 'h-1.5 w-full cursor-row-resize',
      ].join(' ')}
    >
      <div className={[
        'rounded-full bg-slate-500 group-hover:bg-blue-400 transition-colors',
        isH ? 'w-0.5 h-8' : 'h-0.5 w-8',
      ].join(' ')} />
    </div>
  )
}

// ─── Session types ────────────────────────────────────────────────────────────

interface Session { username: string; role: string; color: string }

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const store = useStore()
  const [session,    setSession]    = useState<Session | null>(() => loadSession())
  const [welcomed,   setWelcomed]   = useState(() => !!loadSession())
  const [appVisible, setAppVisible] = useState(false)
  const dbInitRef = useRef<Promise<void> | null>(null)

  const isFirstThemeRender = useRef(true)
  useEffect(() => {
    const html = document.documentElement
    if (isFirstThemeRender.current) {
      isFirstThemeRender.current = false
      html.classList.toggle('light', !store.darkMode)
      return
    }
    html.classList.add('switching-theme')
    html.classList.toggle('light', !store.darkMode)
    const t = setTimeout(() => html.classList.remove('switching-theme'), 280)
    return () => clearTimeout(t)
  }, [store.darkMode])

  useEffect(() => {
    if (session && !dbInitRef.current) {
      dbInitRef.current = initializeDatabase()
    }
    if (session && welcomed) {
      dbInitRef.current!.then(() => {
        // Trigger SchemaExplorer / Sidebar to re-read tables loaded from IndexedDB
        store.incrementDbVersion()
        setTimeout(() => setAppVisible(true), 30)
      })
    }
  }, [session, welcomed]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogin(user: Session) {
    setSession(user)
    setWelcomed(false)
    dbInitRef.current = null
  }

  async function handleEnter() {
    await (dbInitRef.current ?? initializeDatabase())
    store.incrementDbVersion()
    setWelcomed(true)
    setTimeout(() => setAppVisible(true), 30)
  }

  // Panel sizes
  const sidebar = useResize(270, 160, 480, 'h')
  const editor  = useResize(280, 60,  700, 'v')
  const schema  = useResize(240, 60,  520, 'v', true)

  // ── Login screen
  if (!session) return <LoginScreen onLogin={handleLogin} />

  // ── Welcome screen (only on fresh login)
  if (!welcomed) return <WelcomeScreen session={session} onEnter={handleEnter} />

  // ── Main app (fade in)
  return (
    <div
      className="flex flex-col h-screen bg-surface-900 overflow-hidden transition-opacity duration-500"
      style={{ opacity: appVisible ? 1 : 0 }}
    >
      <TopBar session={session} onLogout={() => { localStorage.removeItem(SESSION_KEY); setSession(null); setAppVisible(false) }} />

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <div style={{ width: sidebar.size, flexShrink: 0 }} className="overflow-hidden">
          <Sidebar />
        </div>

        <Handle dir="h" onMouseDown={sidebar.startDrag} />

        {/* ── Main content ───────────────────────────────────────────── */}
        <main className="flex flex-col flex-1 overflow-hidden min-w-0 bg-surface-900">
          <EngineTabs />
          <ConnectionBar />

          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div style={{ height: editor.size, flexShrink: 0 }} className="overflow-hidden">
              <SQLEditor />
            </div>

            <Handle dir="v" onMouseDown={editor.startDrag} />

            <div className="flex-1 min-h-0 overflow-hidden">
              <ResultsPanel />
            </div>

            <Handle dir="v" onMouseDown={schema.startDrag} />

            <div style={{ height: schema.size, flexShrink: 0 }} className="overflow-hidden">
              <SchemaExplorer />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
