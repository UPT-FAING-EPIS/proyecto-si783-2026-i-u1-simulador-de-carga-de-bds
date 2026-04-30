// IndexedDB storage — replaces localStorage for table data.
// Survives logouts, browser restarts, and cache clearing.
// No practical size limit (browsers allow hundreds of MB).

const IDB_NAME     = 'SimuladorBDS'
const IDB_VERSION  = 2          // bumped to 2 to add 'schemas' store
const TABLES_STORE = 'tables'
const SCHEMA_STORE = 'schemas'
const OLD_LS_KEY   = 'simulador_bds_tables'

// ─── Schema entry (saved on import, used on export) ───────────────────────────

export interface SchemaEntry {
  dbName: string
  tableOrder: string[]
  createStatements: Record<string, string>   // tableName → original CREATE TABLE SQL
  identityCols: Record<string, string | null> // tableName → identity column name or null
  insertCols: Record<string, string[]>        // tableName → columns for INSERT (no identity)
}

// ─── Open DB ──────────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(TABLES_STORE))
        db.createObjectStore(TABLES_STORE, { keyPath: 'name' })
      if (!db.objectStoreNames.contains(SCHEMA_STORE))
        db.createObjectStore(SCHEMA_STORE, { keyPath: 'dbName' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export async function idbSaveTables(tables: { name: string; data: object[] }[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(TABLES_STORE, 'readwrite')
    const store = tx.objectStore(TABLES_STORE)
    store.clear()
    for (const t of tables) store.put(t)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

export async function idbLoadTables(): Promise<{ name: string; data: object[] }[]> {
  const db = await openDB()

  // One-time migration from old localStorage format
  const legacy = localStorage.getItem(OLD_LS_KEY)
  if (legacy) {
    try {
      const old: { name: string; data: object[] }[] = JSON.parse(legacy)
      if (old.length > 0) {
        await idbSaveTables(old)
        localStorage.removeItem(OLD_LS_KEY)
        return old
      }
    } catch { /* ignore bad data */ }
    localStorage.removeItem(OLD_LS_KEY)
  }

  return new Promise((resolve, reject) => {
    const tx  = db.transaction(TABLES_STORE, 'readonly')
    const req = tx.objectStore(TABLES_STORE).getAll()
    req.onsuccess = () => resolve(req.result as { name: string; data: object[] }[])
    req.onerror   = () => reject(req.error)
  })
}

export async function idbClearTables(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TABLES_STORE, 'readwrite')
    tx.objectStore(TABLES_STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

export async function idbSaveSchema(entry: SchemaEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCHEMA_STORE, 'readwrite')
    tx.objectStore(SCHEMA_STORE).put(entry)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

export async function idbLoadAllSchemas(): Promise<SchemaEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(SCHEMA_STORE, 'readonly')
    const req = tx.objectStore(SCHEMA_STORE).getAll()
    req.onsuccess = () => resolve(req.result as SchemaEntry[])
    req.onerror   = () => reject(req.error)
  })
}

export async function idbDeleteSchema(dbName: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCHEMA_STORE, 'readwrite')
    tx.objectStore(SCHEMA_STORE).delete(dbName)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}
