import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { ref, set, get, remove, onDisconnect } from 'firebase/database'
import { db, auth } from './firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  username:  string
  email:     string
  role:      string
  color:     string
  pin:       string
  provider:  'email' | 'google'
  createdAt: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUidByUsername(username: string): Promise<string | null> {
  if (!db) return null
  const snap = await get(ref(db, `usernames/${username.toLowerCase()}`))
  return snap.exists() ? (snap.val() as string) : null
}

async function getProfileByUid(uid: string): Promise<UserProfile | null> {
  if (!db) return null
  const snap = await get(ref(db, `users/${uid}`))
  return snap.exists() ? (snap.val() as UserProfile) : null
}

// ─── Session management (one active session per account) ─────────────────────

const STALE_MS = 24 * 60 * 60 * 1000  // treat session as stale after 24 h

function makeToken(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

async function checkSession(path: string): Promise<void> {
  if (!db) return
  const snap = await get(ref(db, path))
  if (!snap.exists()) return
  const data = snap.val() as { loginAt?: number }
  if (Date.now() - (data?.loginAt ?? 0) > STALE_MS) {
    await remove(ref(db, path))
    return
  }
  throw new Error('session-active')
}

async function openSession(path: string): Promise<void> {
  if (!db) return
  const nodeRef = ref(db, path)
  await set(nodeRef, { token: makeToken(), loginAt: Date.now() })
  onDisconnect(nodeRef).remove()
}

export async function clearActiveSession(uid: string): Promise<void> {
  if (!db) return
  const path = uid === 'admin'
    ? 'activeSessions/admin'
    : `users/${uid}/activeSession`
  await remove(ref(db, path))
}

// For the hardcoded admin account (no Firebase Auth)
export async function checkAndSetAdminSession(): Promise<void> {
  if (!db) return  // Firebase not configured — allow admin to work offline
  await checkSession('activeSessions/admin')
  await openSession('activeSessions/admin')
}

// ─── Register with email/password ────────────────────────────────────────────

export async function registerUser(params: {
  email:    string
  password: string
  username: string
  pin:      string
  color:    string
}): Promise<UserProfile & { uid: string }> {
  if (!db || !auth) throw new Error('firebase-not-configured')

  const { email, password, username, pin, color } = params

  const existing = await getUidByUsername(username)
  if (existing) throw new Error('username-taken')

  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const uid  = cred.user.uid

  const profile: UserProfile = {
    username, email, role: 'Usuario', color, pin,
    provider: 'email', createdAt: Date.now(),
  }

  await set(ref(db, `users/${uid}`), profile)
  await set(ref(db, `usernames/${username.toLowerCase()}`), uid)
  await openSession(`users/${uid}/activeSession`)

  return { ...profile, uid }
}

// ─── Login with username + password ──────────────────────────────────────────

export async function loginWithUsername(username: string, password: string): Promise<UserProfile & { uid: string }> {
  if (!db || !auth) throw new Error('firebase-not-configured')

  const uid = await getUidByUsername(username)
  if (!uid) throw new Error('user-not-found')

  const profile = await getProfileByUid(uid)
  if (!profile) throw new Error('user-not-found')

  await checkSession(`users/${uid}/activeSession`)
  await signInWithEmailAndPassword(auth, profile.email, password)
  await openSession(`users/${uid}/activeSession`)

  return { ...profile, uid }
}

// ─── Google Sign-In ───────────────────────────────────────────────────────────

export interface GoogleSignInResult {
  profile:     UserProfile | null
  isNew:       boolean
  uid:         string
  googleEmail: string
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!auth) throw new Error('firebase-not-configured')

  const provider = new GoogleAuthProvider()
  const cred     = await signInWithPopup(auth, provider)
  const uid         = cred.user.uid
  const googleEmail = cred.user.email ?? ''

  const profile = await getProfileByUid(uid)

  if (profile) {
    await checkSession(`users/${uid}/activeSession`)
    await openSession(`users/${uid}/activeSession`)
  }

  return { profile, isNew: !profile, uid, googleEmail }
}

// ─── Create profile for new Google user (after choosing username) ─────────────

export async function createGoogleProfile(params: {
  uid:      string
  email:    string
  username: string
  color:    string
}): Promise<UserProfile & { uid: string }> {
  if (!db) throw new Error('firebase-not-configured')

  const { uid, email, username, color } = params

  const existing = await getUidByUsername(username)
  if (existing) throw new Error('username-taken')

  const profile: UserProfile = {
    username, email, role: 'Usuario', color, pin: '',
    provider: 'google', createdAt: Date.now(),
  }

  await set(ref(db, `users/${uid}`), profile)
  await set(ref(db, `usernames/${username.toLowerCase()}`), uid)
  await openSession(`users/${uid}/activeSession`)

  return { ...profile, uid }
}

// ─── Forgot password — send reset email ──────────────────────────────────────

export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('firebase-not-configured')
  await sendPasswordResetEmail(auth, email)
}
