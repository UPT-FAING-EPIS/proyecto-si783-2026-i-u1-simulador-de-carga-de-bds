import { ref, get, set, onValue, type Unsubscribe } from 'firebase/database'
import { db, isConfigured } from './firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ManagedUser {
  uid:       string
  username:  string
  email:     string
  role:      string
  provider:  'email' | 'google'
  color:     string
  createdAt: number
}

// ─── Leer todos los usuarios ──────────────────────────────────────────────────

export function subscribeToUsers(
  callback: (users: ManagedUser[]) => void
): Unsubscribe | (() => void) {
  if (!isConfigured || !db) { callback([]); return () => {} }

  return onValue(ref(db, 'users'), snapshot => {
    const data = snapshot.val() as Record<string, Omit<ManagedUser, 'uid'>> | null
    if (!data) { callback([]); return }

    const users: ManagedUser[] = Object.entries(data).map(([uid, v]) => ({
      uid,
      username:  v.username  ?? 'Sin nombre',
      email:     v.email     ?? '',
      role:      v.role      ?? 'Usuario',
      provider:  v.provider  ?? 'email',
      color:     v.color     ?? '#6366f1',
      createdAt: v.createdAt ?? 0,
    }))

    callback(users.sort((a, b) => b.createdAt - a.createdAt))
  })
}

// ─── Actualizar rol de un usuario ─────────────────────────────────────────────

export async function updateUserRole(uid: string, role: 'Usuario' | 'Administrador'): Promise<void> {
  if (!isConfigured || !db) return
  await set(ref(db, `users/${uid}/role`), role)
}

// ─── Verificar si un UID tiene rol Administrador en Firebase ─────────────────

export async function isAdminByUid(uid: string): Promise<boolean> {
  if (!isConfigured || !db) return false
  const snap = await get(ref(db, `users/${uid}/role`))
  return snap.exists() && snap.val() === 'Administrador'
}
