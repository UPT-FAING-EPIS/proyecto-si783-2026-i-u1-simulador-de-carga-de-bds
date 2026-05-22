import { useState, useEffect } from 'react'
import {
  Database, Upload, Download, Play, Square, Trash2,
  Moon, Sun, HelpCircle, Settings, LogOut, ChevronDown, Activity, Users, FileText, GitCompare,
} from 'lucide-react'
import { useStore, getActiveTab } from '../store/useStore'
import { executeSQL, executeMongoQuery, executeRedisCommand, initializeDatabase, preprocessSQL } from '../engines/sqlEngine'
import DatabaseManagerModal from './DatabaseManagerModal'
import ExportModal from './modals/ExportModal'
import HelpModal from './modals/HelpModal'
import SettingsModal from './modals/SettingsModal'
import StatsModal from './modals/StatsModal'
import HistoryModal from './modals/HistoryModal'
import QueryLogsModal from './modals/QueryLogsModal'
import AboutModal from './modals/AboutModal'
import UserDropdown from './modals/UserDropdown'
import { EnvButton } from './modals/EnvModal'
import LoadSimulatorModal from './LoadSimulatorModal'
import SyntaxComparatorModal from './modals/SyntaxComparatorModal'
import OnlineUsersPanel from './OnlineUsersPanel'
import { subscribeToCount } from '../lib/presence'
import { isConfigured } from '../lib/firebase'

type Modal = 'import' | 'export' | 'help' | 'settings' | 'user' | 'stats' | 'history' | 'logs' | 'about' | 'load' | 'online' | 'compare' | null

interface TopBarProps {
  session?: { username: string; role: string; color: string }
  onLogout?: () => void
}

export default function TopBar({ session, onLogout }: TopBarProps) {
  const store = useStore()
  const tab   = getActiveTab(store)
  const [modal, setModal] = useState<Modal>(null)

  // Contador real de Firebase (0 si no está configurado)
  const [onlineCount, setOnlineCount] = useState(0)
  useEffect(() => {
    const unsub = subscribeToCount(setOnlineCount)
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // ── Execute ───────────────────────────────────────────────────────────────
  async function handleExecute() {
    if (!tab || store.isExecuting) return
    initializeDatabase()
    store.setIsExecuting(true)
    store.setActiveResultsTab('results')
    const t0 = performance.now()
    const queryToRun = tab.selectedText?.trim() || tab.query
    try {
      const result =
        tab.engine === 'mongodb' ? executeMongoQuery(queryToRun)
        : tab.engine === 'redis' ? executeRedisCommand(queryToRun)
        : await executeSQL(queryToRun, store.simulation.networkLatency, store.simulation.simulateErrors, store.simulation.errorProbability, store.activeDbName, store.databases)

      store.setTabResults(tab.id, result)
      const isSelection = !!(tab.selectedText?.trim())
      store.setTabMessages(tab.id, [
        `[${new Date().toLocaleTimeString()}] ✓ Consulta ejecutada exitosamente${isSelection ? ' (selección)' : ''}`,
        `   Filas devueltas : ${result.rowCount}`,
        `   Tiempo          : ${result.executionTime.toFixed(3)} ms`,
        `   Memoria         : ${result.memoryUsage.toFixed(2)} MB`,
        `   Motor           : ${tab.engine.toUpperCase()}`,
        `   Base de datos   : ${tab.database}`,
      ])

      const elapsed = performance.now() - t0
      const mm = Math.floor(elapsed / 60000).toString().padStart(2, '0')
      const ss = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0')
      const ms = Math.floor(elapsed % 1000).toString().padStart(3, '0')
      store.setMetrics({ executionTime: `00:${mm}:${ss}.${ms}`, rowsAffected: result.rowCount, warnings: result.warnings, memoryUsage: `${result.memoryUsage.toFixed(2)} MB` })
      store.addHistory({ id: Date.now().toString(), query: tab.query, timestamp: new Date(), engine: tab.engine, rowCount: result.rowCount, executionTime: result.executionTime })

      if (/^\s*(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE)\s/i.test(tab.query))
        store.incrementDbVersion()

      // Auto-register database + tables — parse only, no re-execution
      if (/CREATE\s+DATABASE|CREATE\s+TABLE/i.test(tab.query)) {
        const DB_COLORS  = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']
        const { processed, dbName: parsedDbName } = preprocessSQL(tab.query)
        const createDbMatch = tab.query.match(/CREATE\s+DATABASE\s+(\w+)/i)
        const dbName = parsedDbName ?? (createDbMatch ? createDbMatch[1] : null) ?? store.activeDbName

        if (dbName) {
          const tables   = [...processed.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/gi)]
                            .map(m => m[1]).filter((v, i, a) => a.indexOf(v) === i)
          const existing = store.databases.find(d => d.name === dbName)?.tables ?? []
          const colorIdx = store.databases.findIndex(d => d.name === dbName)
          const color    = colorIdx >= 0 ? store.databases[colorIdx].color : DB_COLORS[store.databases.length % DB_COLORS.length]
          store.registerDatabase(dbName, [...new Set([...existing, ...tables])], color)
        }
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      store.setTabResults(tab.id, null)
      store.setTabMessages(tab.id, [`[${new Date().toLocaleTimeString()}] ✗ ERROR: ${msg}`])
      store.setActiveResultsTab('messages')
    } finally {
      store.setIsExecuting(false)
    }
  }

  const open  = (m: Modal) => setModal(m)
  const close = () => setModal(null)

  // ── Sub-components ────────────────────────────────────────────────────────

  const Sep = () => <div className="w-px h-5 bg-surface-600 mx-2 shrink-0" />

  const GhostBtn = ({
    icon, label, title, onClick, danger = false,
  }: { icon: React.ReactNode; label?: string; title?: string; onClick: () => void; danger?: boolean }) => (
    <button
      title={title}
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all select-none',
        danger
          ? 'text-slate-400 hover:text-red-300 hover:bg-red-900/20'
          : 'text-slate-400 hover:text-white hover:bg-surface-600',
      ].join(' ')}
    >
      {icon}
      {label && <span className="hidden md:inline">{label}</span>}
    </button>
  )

  const IconBtn = ({
    icon, title, onClick, active,
  }: { icon: React.ReactNode; title: string; onClick: () => void; active?: boolean }) => (
    <button
      title={title}
      onClick={onClick}
      className={[
        'w-8 h-8 flex items-center justify-center rounded-lg transition-all',
        active
          ? 'bg-surface-600 text-white'
          : 'text-slate-400 hover:text-white hover:bg-surface-600',
      ].join(' ')}
    >
      {icon}
    </button>
  )

  return (
    <>
      <header className="flex items-center h-[52px] px-3 bg-surface-800 border-b border-surface-600 shrink-0 relative z-30">

        {/* ── Brand ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 mr-1 select-none">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Database size={15} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-surface-800" />
          </div>
          <div className="hidden lg:flex flex-col gap-[3px] leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold tracking-tight text-white">
                Simulador <span className="text-blue-400">DB</span>
              </span>
              <span className="text-[9px] font-semibold px-1.5 py-px rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30">
                v1.6.0
              </span>
            </div>
            <span className="text-[10px] text-slate-500 tracking-wide">Multi-Engine Simulator</span>
          </div>
        </div>

        <Sep />

        {/* ── Environment ──────────────────────────────────────────────────── */}
        <EnvButton />

        <Sep />

        {/* ── File actions ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5">
          <GhostBtn icon={<Upload size={13} />}   label="Importar" onClick={() => open('import')} />
          <GhostBtn icon={<Download size={13} />} label="Exportar" onClick={() => open('export')} />
        </div>

        <Sep />

        {/* ── Query actions ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5">

          {/* Execute — primary CTA */}
          <button
            onClick={handleExecute}
            disabled={store.isExecuting}
            className="flex items-center gap-2 h-8 px-4 rounded-lg text-xs font-semibold text-white select-none
                       bg-gradient-to-r from-green-500 to-emerald-600
                       hover:from-green-400 hover:to-emerald-500
                       active:from-green-600 active:to-emerald-700
                       shadow-md shadow-green-900/30
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all"
          >
            {store.isExecuting
              ? <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
              : <Play size={12} className="fill-white shrink-0" />
            }
            <span>{store.isExecuting ? 'Ejecutando…' : 'Ejecutar'}</span>
            {!store.isExecuting && (
              <span className="hidden lg:inline text-[10px] text-white/50 font-normal">F5</span>
            )}
          </button>

          {/* Stop — only visually prominent when running */}
          <button
            onClick={() => store.setIsExecuting(false)}
            title="Detener ejecución"
            className={[
              'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all select-none',
              store.isExecuting
                ? 'text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-800/40'
                : 'text-slate-500 hover:text-slate-300 hover:bg-surface-600',
            ].join(' ')}
          >
            <Square size={12} className={store.isExecuting ? 'fill-red-400' : ''} />
            <span className="hidden md:inline">Detener</span>
          </button>

          {/* Clear */}
          <GhostBtn
            icon={<Trash2 size={13} />}
            label="Limpiar"
            title="Limpiar editor y resultados"
            onClick={() => {
              if (tab) {
                store.updateQuery(tab.id, '')
                store.setTabResults(tab.id, null)
                store.setTabMessages(tab.id, [])
              }
            }}
          />
        </div>

        <Sep />

        {/* ── Load Simulator ───────────────────────────────────────────────── */}
        <button
          title="Simulador de Carga — genera miles de consultas y monitorea en tiempo real"
          onClick={() => open('load')}
          className={[
            'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all select-none',
            modal === 'load'
              ? 'text-orange-300 bg-orange-900/30 border border-orange-800/50'
              : 'text-slate-400 hover:text-orange-300 hover:bg-orange-900/20 border border-transparent',
          ].join(' ')}
        >
          <Activity size={13} />
          <span className="hidden md:inline">Sim. Carga</span>
        </button>

        {/* ── Syntax Comparator ────────────────────────────────────────────── */}
        <button
          title="Comparador de Sintaxis — el mismo script en los 7 motores"
          onClick={() => open('compare')}
          className={[
            'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all select-none',
            modal === 'compare'
              ? 'text-violet-300 bg-violet-900/30 border border-violet-800/50'
              : 'text-slate-400 hover:text-violet-300 hover:bg-violet-900/20 border border-transparent',
          ].join(' ')}
        >
          <GitCompare size={13} />
          <span className="hidden md:inline">Comparar</span>
        </button>

        <div className="flex-1" />

        {/* ── Right tools ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5">

          {/* Online users indicator — solo visible para Administrador */}
          {session?.role === 'Administrador' && (
            <>
              <div className="relative">
                <button
                  title={isConfigured ? 'Usuarios conectados en tiempo real' : 'Configura Firebase para ver usuarios reales'}
                  onClick={() => setModal(m => m === 'online' ? null : 'online')}
                  className={[
                    'flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-all select-none',
                    modal === 'online'
                      ? 'bg-emerald-900/30 border border-emerald-800/40 text-emerald-300'
                      : isConfigured
                        ? 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-900/20 border border-transparent'
                        : 'text-slate-600 hover:text-slate-400 hover:bg-surface-600 border border-transparent',
                  ].join(' ')}
                >
                  {isConfigured ? (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                  )}
                  <Users size={12} />
                  <span className="tabular-nums font-semibold">
                    {isConfigured ? onlineCount.toLocaleString('es') : '—'}
                  </span>
                </button>

                {modal === 'online' && (
                  <OnlineUsersPanel
                    onClose={close}
                    session={session}
                  />
                )}
              </div>

              <Sep />
            </>
          )}

          {/* Theme */}
          <IconBtn
            icon={store.darkMode ? <Moon size={15} /> : <Sun size={15} />}
            title={store.darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            onClick={store.toggleDarkMode}
          />

          <Sep />

          <IconBtn
            icon={<HelpCircle size={15} />}
            title="Ayuda y atajos de teclado"
            onClick={() => open('help')}
            active={modal === 'help'}
          />
          <IconBtn
            icon={<FileText size={15} />}
            title="Logs de consultas"
            onClick={() => open('logs')}
            active={modal === 'logs'}
          />
          <IconBtn
            icon={<Settings size={15} />}
            title="Configuración"
            onClick={() => open('settings')}
            active={modal === 'settings'}
          />

          <Sep />

          {/* User chip */}
          <div className="relative">
            <button
              title="Perfil de usuario"
              onClick={() => setModal(m => m === 'user' ? null : 'user')}
              className={[
                'flex items-center gap-2 pl-1.5 pr-2 h-8 rounded-lg transition-all',
                modal === 'user' ? 'bg-surface-600' : 'hover:bg-surface-600',
              ].join(' ')}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ring-1 ring-white/10"
                style={{ background: session?.color ?? '#3b82f6' }}
              >
                {session?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="hidden lg:block text-left leading-none">
                <div className="text-[11px] font-semibold text-slate-200">{session?.username ?? 'Usuario'}</div>
                <div className="text-[9px] text-slate-500">{session?.role ?? 'Demo'}</div>
              </div>
              <ChevronDown
                size={10}
                className={`hidden lg:block text-slate-500 transition-transform duration-200 ${modal === 'user' ? 'rotate-180' : ''}`}
              />
            </button>

            {modal === 'user' && (
              <UserDropdown onClose={close} session={session} onOpenModal={m => setModal(m)} />
            )}
          </div>

          {onLogout && (
            <button
              title="Cerrar sesión"
              onClick={onLogout}
              className="w-8 h-8 flex items-center justify-center rounded-lg ml-0.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </header>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modal === 'import'   && <DatabaseManagerModal onClose={close} />}
      {modal === 'export'   && <ExportModal onClose={close} />}
      {modal === 'help'     && <HelpModal onClose={close} />}
      {modal === 'settings' && <SettingsModal onClose={close} />}
      {modal === 'stats'    && <StatsModal onClose={close} />}
      {modal === 'history'  && <HistoryModal onClose={close} />}
      {modal === 'logs'     && <QueryLogsModal onClose={close} />}
      {modal === 'about'    && <AboutModal onClose={close} />}
      {modal === 'load'     && <LoadSimulatorModal onClose={close} />}
      {modal === 'compare'  && <SyntaxComparatorModal onClose={close} />}
      {/* OnlineUsersPanel se renderiza inline dentro del botón relativo */}
    </>
  )
}
