import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'
import { getAuth, type Auth } from 'firebase/auth'

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string | undefined,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string | undefined,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       as string | undefined,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string | undefined,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string | undefined,
}

export const isConfigured = !!cfg.databaseURL && !!cfg.apiKey

let app:  FirebaseApp | null = null
let db:   Database    | null = null
let auth: Auth        | null = null

if (isConfigured) {
  app  = getApps().length === 0 ? initializeApp(cfg as Required<typeof cfg>) : getApps()[0]
  db   = getDatabase(app)
  auth = getAuth(app)
}

export { db, auth }
