import { create } from 'zustand'
import { ENGINE_CONFIGS } from '../types'
import type { EngineType, EngineTab, SimulationSettings, Metrics, QueryHistoryItem, IsolationLevel } from '../types'

// ─── Database registry persistence ───────────────────────────────────────────

const DB_REGISTRY_KEY = 'simulador_bds_databases'

interface DBEntry { name: string; tables: string[]; color?: string }

function loadDatabases(): DBEntry[] {
  try {
    const raw = localStorage.getItem(DB_REGISTRY_KEY)
    if (!raw) return []
    const parsed: DBEntry[] = JSON.parse(raw)
    return parsed
  } catch { return [] }
}

function saveDatabases(dbs: DBEntry[]) {
  try { localStorage.setItem(DB_REGISTRY_KEY, JSON.stringify(dbs)) } catch { /* ignore */ }
}

let tabCounter = 0
function newTab(engine: EngineType): EngineTab {
  const cfg = ENGINE_CONFIGS[engine]
  return {
    id: `tab-${++tabCounter}`,
    engine,
    database: cfg.defaultDatabase,
    connection: cfg.defaultConnection,
    query: cfg.defaultQuery,
    results: null,
    messages: [],
  }
}

interface AppState {
  // Tabs
  tabs: EngineTab[]
  activeTabId: string
  addTab: (engine: EngineType) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateQuery: (id: string, query: string) => void
  setTabResults: (id: string, results: EngineTab['results']) => void
  setTabMessages: (id: string, messages: string[]) => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Environment
  environment: string
  setEnvironment: (e: string) => void

  // Autocommit
  autocommit: boolean
  toggleAutocommit: () => void

  // Execution
  isExecuting: boolean
  setIsExecuting: (v: boolean) => void

  // Results tab
  activeResultsTab: 'results' | 'messages'
  setActiveResultsTab: (t: 'results' | 'messages') => void

  // Simulation
  simulation: SimulationSettings
  setSimulation: (s: Partial<SimulationSettings>) => void

  // Metrics
  metrics: Metrics
  setMetrics: (m: Metrics) => void

  // History
  history: QueryHistoryItem[]
  addHistory: (item: QueryHistoryItem) => void
  clearHistory: () => void

  // Theme
  darkMode: boolean
  toggleDarkMode: () => void

  // DB version (triggers schema explorer refresh)
  dbVersion: number
  incrementDbVersion: () => void

  // Database registry (tracks which tables belong to which DB)
  databases: { name: string; tables: string[]; color?: string }[]
  activeDbName: string
  registerDatabase: (name: string, tables: string[], color?: string) => void
  setActiveDbName: (name: string) => void
  unregisterDatabase: (name: string) => void

  // Editor settings
  editorFontSize: number
  setEditorFontSize: (n: number) => void
  editorTheme: string
  setEditorTheme: (t: string) => void
  editorFontFamily: string
  setEditorFontFamily: (f: string) => void
  editorWordWrap: boolean
  setEditorWordWrap: (v: boolean) => void
  editorLineNumbers: boolean
  setEditorLineNumbers: (v: boolean) => void
}

const defaultSimulation: SimulationSettings = {
  networkLatency: 10,
  connectionLimit: 50,
  simulateErrors: false,
  errorProbability: 0,
  isolationLevel: 'READ COMMITTED' as IsolationLevel,
}

const defaultMetrics: Metrics = {
  executionTime: '00:00:00.000',
  rowsAffected: 0,
  warnings: 0,
  memoryUsage: '0.00 MB',
}

const initialTab = newTab('sqlserver')

export const useStore = create<AppState>((set, get) => ({
  tabs: [initialTab],
  activeTabId: initialTab.id,

  addTab: (engine) => {
    const tab = newTab(engine)
    set(s => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }))
  },
  removeTab: (id) => {
    const { tabs, activeTabId } = get()
    if (tabs.length === 1) return
    const idx = tabs.findIndex(t => t.id === id)
    const next = tabs[idx === 0 ? 1 : idx - 1]
    set({ tabs: tabs.filter(t => t.id !== id), activeTabId: activeTabId === id ? next.id : activeTabId })
  },
  setActiveTab: (id) => set({ activeTabId: id }),
  updateQuery: (id, query) =>
    set(s => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, query } : t) })),
  setTabResults: (id, results) =>
    set(s => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, results } : t) })),
  setTabMessages: (id, messages) =>
    set(s => ({ tabs: s.tabs.map(t => t.id === id ? { ...t, messages } : t) })),

  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  environment: 'Desarrollo',
  setEnvironment: (e) => set({ environment: e }),

  autocommit: true,
  toggleAutocommit: () => set(s => ({ autocommit: !s.autocommit })),

  isExecuting: false,
  setIsExecuting: (v) => set({ isExecuting: v }),

  activeResultsTab: 'results',
  setActiveResultsTab: (t) => set({ activeResultsTab: t }),

  simulation: defaultSimulation,
  setSimulation: (s) => set(prev => ({ simulation: { ...prev.simulation, ...s } })),

  metrics: defaultMetrics,
  setMetrics: (m) => set({ metrics: m }),

  history: [],
  addHistory: (item) => set(s => ({ history: [item, ...s.history].slice(0, 50) })),
  clearHistory: () => set({ history: [] }),

  darkMode: localStorage.getItem('theme') !== 'light',
  toggleDarkMode: () => set(s => {
    const next = !s.darkMode
    localStorage.setItem('theme', next ? 'dark' : 'light')
    return { darkMode: next, editorTheme: next ? 'vs-dark' : 'vs' }
  }),

  dbVersion: 0,
  incrementDbVersion: () => set(s => ({ dbVersion: s.dbVersion + 1 })),

  databases: loadDatabases(),
  activeDbName: loadDatabases()[0]?.name ?? '',
  registerDatabase: (name, tables, color) => set(s => {
    const existing = s.databases.find(d => d.name === name)
    const updated = existing
      ? s.databases.map(d => d.name === name ? { ...d, tables, ...(color ? { color } : {}) } : d)
      : [...s.databases, { name, tables, color: color ?? '#6366f1' }]
    saveDatabases(updated)
    return { databases: updated, activeDbName: name }
  }),
  setActiveDbName: (name) => set({ activeDbName: name }),
  unregisterDatabase: (name) => set(s => {
    const updated = s.databases.filter(d => d.name !== name)
    saveDatabases(updated)
    return {
      databases: updated,
      activeDbName: s.activeDbName === name ? (updated[0]?.name ?? '') : s.activeDbName,
    }
  }),

  editorFontSize: 13,
  setEditorFontSize: (n) => set({ editorFontSize: n }),
  editorTheme: localStorage.getItem('theme') === 'light' ? 'vs' : 'vs-dark',
  setEditorTheme: (t) => set({ editorTheme: t }),
  editorFontFamily: 'JetBrains Mono',
  setEditorFontFamily: (f) => set({ editorFontFamily: f }),
  editorWordWrap: true,
  setEditorWordWrap: (v) => set({ editorWordWrap: v }),
  editorLineNumbers: true,
  setEditorLineNumbers: (v) => set({ editorLineNumbers: v }),
}))

export function getActiveTab(state: AppState): EngineTab | undefined {
  return state.tabs.find(t => t.id === state.activeTabId)
}
