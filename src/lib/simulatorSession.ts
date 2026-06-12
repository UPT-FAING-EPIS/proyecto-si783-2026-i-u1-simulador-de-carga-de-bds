import {
  ref, set, remove, update, onValue, onDisconnect,
  serverTimestamp, type Unsubscribe,
} from 'firebase/database'
import { db, isConfigured } from './firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SimulatorSession {
  id:           string
  name:         string
  engine:       string
  queryTypes:   { SELECT: boolean; INSERT: boolean; UPDATE: boolean; DELETE: boolean }
  status:       'idle' | 'running' | 'completed'
  tps:          number
  currentUsers: number
  maxUsers:     number
  cpuUsage:     number
  latency:      number
  connectedAt:  number | null
  updatedAt:    number | null
}

export interface ActivityUpdate {
  engine:       string
  queryTypes:   { SELECT: boolean; INSERT: boolean; UPDATE: boolean; DELETE: boolean }
  status:       'idle' | 'running' | 'completed'
  tps:          number
  currentUsers: number
  maxUsers:     number
  cpuUsage:     number
  latency:      number
}

// ─── Session id único por pestaña ─────────────────────────────────────────────

let sessionId: string | null = null

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
  return sessionId
}

// ─── Registrar usuario web ────────────────────────────────────────────────────

export function registerSimulatorSession(name: string): void {
  if (!isConfigured || !db) return

  const id      = getSessionId()
  const sessRef = ref(db, `simulator_web/${id}`)

  set(sessRef, {
    name,
    engine:       'mysql',
    queryTypes:   { SELECT: false, INSERT: false, UPDATE: false, DELETE: false },
    status:       'idle',
    tps:          0,
    currentUsers: 0,
    maxUsers:     0,
    cpuUsage:     0,
    latency:      0,
    connectedAt:  serverTimestamp(),
    updatedAt:    serverTimestamp(),
  })

  onDisconnect(sessRef).remove()
}

// ─── Actualizar actividad en cada tick ───────────────────────────────────────

export function updateSimulatorActivity(data: ActivityUpdate): void {
  if (!isConfigured || !db || !sessionId) return
  update(ref(db, `simulator_web/${sessionId}`), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// ─── Eliminar sesión al salir ─────────────────────────────────────────────────

export function unregisterSimulatorSession(): void {
  if (!isConfigured || !db || !sessionId) return
  remove(ref(db, `simulator_web/${sessionId}`))
  sessionId = null
}

// ─── Suscripción para el panel de admin ──────────────────────────────────────

export function subscribeToSimulatorSessions(
  callback: (sessions: SimulatorSession[]) => void
): Unsubscribe | (() => void) {
  if (!isConfigured || !db) {
    callback([])
    return () => {}
  }

  const webRef = ref(db, 'simulator_web')
  return onValue(webRef, snapshot => {
    const data = snapshot.val() as Record<string, Omit<SimulatorSession, 'id'>> | null
    if (!data) { callback([]); return }

    const sessions: SimulatorSession[] = Object.entries(data).map(([id, v]) => ({
      id,
      name:         v.name         ?? 'Usuario',
      engine:       v.engine       ?? 'mysql',
      queryTypes:   v.queryTypes   ?? { SELECT: false, INSERT: false, UPDATE: false, DELETE: false },
      status:       v.status       ?? 'idle',
      tps:          v.tps          ?? 0,
      currentUsers: v.currentUsers ?? 0,
      maxUsers:     v.maxUsers     ?? 0,
      cpuUsage:     v.cpuUsage     ?? 0,
      latency:      v.latency      ?? 0,
      connectedAt:  v.connectedAt  ?? null,
      updatedAt:    v.updatedAt    ?? null,
    }))

    callback(sessions)
  })
}
