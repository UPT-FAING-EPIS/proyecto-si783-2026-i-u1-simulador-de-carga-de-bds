import type { EngineType } from '../types'

export interface LoadHistoryEntry {
  id: string
  savedAt: string
  mode: 'normal' | 'compare' | 'progressive'
  engine: EngineType
  engineB?: EngineType
  duration: number
  maxUsers: number
  rampUp: number
  queryTypes: string
  peakTps: number
  avgLatency: number
  finalLatency: number
  totalErrors: number
  finalCpu: number
  breakingPointUsers?: number
  // Solo presente en mode 'compare'
  peakTpsB?: number
  avgLatencyB?: number
  totalErrorsB?: number
}

const STORAGE_KEY = 'simdb_load_history'
const MAX_ENTRIES = 20

export function loadHistory(): LoadHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveHistoryEntry(entry: Omit<LoadHistoryEntry, 'id' | 'savedAt'>): LoadHistoryEntry {
  const full: LoadHistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
  }
  const next = [full, ...loadHistory()].slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage lleno o no disponible — se ignora silenciosamente
  }
  return full
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // no-op
  }
}

export function deleteHistoryEntry(id: string): void {
  const next = loadHistory().filter(entry => entry.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // no-op
  }
}
