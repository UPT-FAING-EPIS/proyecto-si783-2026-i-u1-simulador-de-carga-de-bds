/* eslint-disable @typescript-eslint/no-explicit-any */
import alasql from 'alasql'
import type { QueryResult } from '../types'
import { idbSaveTables, idbLoadTables, idbClearTables, idbSaveSchema, type SchemaEntry } from '../db/idbStorage'

// ─── Init ────────────────────────────────────────────────────────────────────

let initialized = false
let initPromise: Promise<void> | null = null

const DB_REGISTRY_KEY = 'simulador_bds_databases'

export function initializeDatabase(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = _init()
  return initPromise
}

async function _init() {
  if (initialized) return
  initialized = true

  const registry = localStorage.getItem(DB_REGISTRY_KEY)
  const hasRegisteredDbs = registry && JSON.parse(registry).length > 0
  if (!hasRegisteredDbs) {
    await idbClearTables()
    return
  }

  await loadPersistedTables()
}

function _createTable(name: string, data: object[]) {
  try { alasql(`DROP TABLE IF EXISTS \`${name}\``) } catch (_) { /* ignore */ }
  alasql(`CREATE TABLE \`${name}\``)
  ;(alasql as any).tables[name].data = data.map(r => ({ ...r }))
}

// ─── Persistence (IndexedDB) ─────────────────────────────────────────────────

export function persistTables() {
  const snapshot = getAllTableInfos().map(t => ({
    name: t.name,
    data: (alasql as any).tables[t.name]?.data ?? [],
  }))
  idbSaveTables(snapshot).catch(() => { /* ignore */ })
}

async function loadPersistedTables() {
  try {
    const tables = await idbLoadTables()
    for (const t of tables) _createTable(t.name, t.data)
  } catch (_) { /* ignore */ }
}

export async function clearAllTables() {
  for (const t of getAllTableInfos()) {
    try { alasql(`DROP TABLE IF EXISTS \`${t.name}\``) } catch (_) { /* ignore */ }
  }
  await idbClearTables()
}

export function dropDatabaseTables(tableNames: string[]) {
  for (const name of tableNames) {
    try { alasql(`DROP TABLE IF EXISTS \`${name}\``) } catch { /* ignore */ }
  }
  persistTables()
}

// ─── Introspection ───────────────────────────────────────────────────────────

export interface TableInfo {
  name: string
  rowCount: number
  columns: string[]
}

export function getAllTableInfos(): TableInfo[] {
  const tables = (alasql as any).tables as Record<string, { data?: unknown[] }>
  return Object.keys(tables).map(name => {
    const data = tables[name]?.data ?? []
    const columns = data.length > 0 ? Object.keys(data[0] as object) : []
    return { name, rowCount: data.length, columns }
  })
}

export function getTablePreview(name: string, limit = 200): QueryResult {
  try {
    const rows = (alasql(`SELECT * FROM \`${name}\` LIMIT ${limit}`) as Record<string, unknown>[])
    return { columns: rows.length > 0 ? Object.keys(rows[0]) : [], rows, rowCount: rows.length, executionTime: 1, memoryUsage: 0.1, warnings: 0 }
  } catch {
    return { columns: [], rows: [], rowCount: 0, executionTime: 0, memoryUsage: 0, warnings: 0 }
  }
}

export function dropTable(name: string) {
  try { alasql(`DROP TABLE IF EXISTS \`${name}\``) } catch (_) { /* ignore */ }
  persistTables()
}

// ─── SQL Server preprocessor ─────────────────────────────────────────────────

export interface PreprocessResult {
  processed: string
  dbName: string | null
  skipped: string[]
}

export function preprocessSQL(sql: string): PreprocessResult {
  // Extract DB name from USE statement before removing it
  const useMatch = sql.match(/^\s*USE\s+\[?(\w+)\]?\s*;?\s*$/im)
  const dbName = useMatch ? useMatch[1] : null
  const skipped: string[] = []

  let s = sql

  // ── Step 1: Remove block comments /* ... */
  s = s.replace(/\/\*[\s\S]*?\*\//g, '')

  // ── Step 2: Remove standalone line comments that are just metadata
  // (keep user comments for readability)

  // ── Step 3: Remove GO (SQL Server batch separator)
  s = s.replace(/^\s*GO\s*;?\s*$/gim, '')

  // ── Step 4: Remove CREATE DATABASE
  s = s.replace(/^\s*CREATE\s+DATABASE\s+.*$/gim, () => { skipped.push('CREATE DATABASE'); return '' })

  // ── Step 5: Remove USE [database]
  s = s.replace(/^\s*USE\s+\S+\s*;?\s*$/gim, '')

  // ── Step 6: Remove SET statements (SQL Server specific)
  s = s.replace(/^\s*SET\s+(?:NOCOUNT|ANSI_NULLS|QUOTED_IDENTIFIER|IDENTITY_INSERT|XACT_ABORT|DATEFIRST|DATEFORMAT|LANGUAGE|TRANSACTION\s+ISOLATION\s+LEVEL)\s+.*$/gim, '')

  // ── Step 7: Remove PRINT statements
  s = s.replace(/^\s*PRINT\s+.*$/gim, '')

  // ── Step 8: Remove IF OBJECT_ID / IF EXISTS DROP TABLE patterns
  s = s.replace(/^\s*IF\s+OBJECT_ID\s*\(.*?\)\s*(?:IS\s+NOT\s+NULL\s*\r?\n)?\s*(?:BEGIN\s*)?\r?\n?\s*DROP\s+TABLE\s+\S+\s*;?\s*(?:END\s*;?)?\s*$/gim, '')
  s = s.replace(/^\s*IF\s+EXISTS\s*\(SELECT.*?\)\s*DROP\s+TABLE\s+\S+\s*;?\s*$/gim, '')
  s = s.replace(/^\s*DROP\s+TABLE\s+IF\s+EXISTS\s+\S+\s*;?\s*$/gim, '')

  // ── Step 9: Remove schema prefixes (dbo., schema., etc.)
  s = s.replace(/\b\w+\.\[?(\w+)\]?(?=\s*\(|\s+VALUES|\s+SET\b|\s+WHERE\b|\s*;)/gi, '$1')
  s = s.replace(/\bdbo\./gi, '')

  // ── Step 10: Remove square brackets around identifiers
  s = s.replace(/\[([^\]]+)\]/g, '$1')

  // ── Step 11: Replace SQL Server types → alasql-compatible
  s = s.replace(/\bNVARCHAR\b/gi, 'VARCHAR')
  s = s.replace(/\bNCHAR\b/gi, 'CHAR')
  s = s.replace(/\bNTEXT\b/gi, 'TEXT')
  s = s.replace(/\bDATETIMEOFFSET(?:\s*\(\d+\))?\b/gi, 'VARCHAR')
  s = s.replace(/\bSMALLDATETIME\b/gi, 'DATETIME')
  s = s.replace(/\bTINYINT\b/gi, 'INT')
  s = s.replace(/\bSMALLINT\b/gi, 'INT')
  s = s.replace(/\bBIGINT\b/gi, 'INT')
  s = s.replace(/\bMONEY\b/gi, 'DECIMAL')
  s = s.replace(/\bSMALLMONEY\b/gi, 'DECIMAL')
  s = s.replace(/\bBIT\b/gi, 'INT')
  s = s.replace(/\bIMAGE\b/gi, 'TEXT')
  s = s.replace(/\bVARBINARY\s*\([^)]*\)/gi, 'TEXT')
  s = s.replace(/\bBINARY\s*\(\d+\)/gi, 'TEXT')
  s = s.replace(/\bUNIQUEIDENTIFIER\b/gi, 'VARCHAR')
  s = s.replace(/\bXML\b/gi, 'TEXT')

  // ── Step 12: Replace IDENTITY(n,n) → AUTOINCREMENT and fix order for alasql
  // alasql requires: INT AUTOINCREMENT PRIMARY KEY (not INT PRIMARY KEY AUTOINCREMENT)
  s = s.replace(/\b(INT|BIGINT|SMALLINT|TINYINT)\s+PRIMARY\s+KEY\s+IDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, '$1 AUTOINCREMENT PRIMARY KEY')
  s = s.replace(/\s+IDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, ' AUTOINCREMENT')

  // ── Step 13: Remove NOT NULL / NULL keywords in column definitions
  s = s.replace(/\s+NOT\s+NULL\b/gi, '')
  // Only remove NULL if it follows a type definition (not in WHERE NULL checks)
  s = s.replace(/(\bVARCHAR\s*\([^)]*\)|\bINT\b|\bDECIMAL\b|\bTEXT\b|\bDATE\b|\bDATETIME\b)\s+NULL\b/gi, '$1')

  // ── Step 14: Remove DEFAULT constraints
  s = s.replace(/\s+DEFAULT\s+(?:N?'[^']*'|\d+(?:\.\d+)?|\(\s*\d+\s*\)|\w+(?:\(\))?)/gi, '')

  // ── Step 15: Remove inline CHECK constraints
  s = s.replace(/\s+CHECK\s*\([^)]*\)/gi, '')

  // ── Step 16: Remove inline REFERENCES (foreign key)
  s = s.replace(/\s+REFERENCES\s+\w+\s*\([^)]*\)(?:\s+ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET\s+NULL|SET\s+DEFAULT|NO\s+ACTION|RESTRICT))?/gi, '')

  // ── Step 17: Remove inline UNIQUE
  s = s.replace(/\b(\w+)\s+(\w+(?:\s*\([^)]*\))?)\s+UNIQUE\b/gi, '$1 $2')

  // ── Step 18: Remove table-level CONSTRAINT definitions (entire line/block)
  // CONSTRAINT FK_xxx FOREIGN KEY (col) REFERENCES table(col)
  s = s.replace(/,\s*\r?\n?\s*CONSTRAINT\s+\w+\s+(?:PRIMARY\s+KEY|UNIQUE|CHECK|FOREIGN\s+KEY)[\s\S]*?(?=,\s*\r?\n|\r?\n\s*\))/gi, '')
  s = s.replace(/,\s*CONSTRAINT\s+\w+\s+[\s\S]*?(?=\))/gi, '')

  // ── Step 19: Remove standalone FOREIGN KEY table constraints
  s = s.replace(/,\s*\r?\n?\s*FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES[^\n,]*/gi, '')

  // ── Step 20: Remove table-level PRIMARY KEY (keep column-level)
  // Only remove when it's a standalone table constraint line: PRIMARY KEY (col1, col2)
  s = s.replace(/,\s*\r?\n?\s*PRIMARY\s+KEY\s*\([^)]*\)/gi, '')

  // ── Step 21: Remove WITH (...) options on CREATE TABLE
  s = s.replace(/\bWITH\s*\([^)]*\)\s*(?=;|$)/gi, '')

  // ── Step 22: Remove ON [PRIMARY] / ON FILEGROUP
  s = s.replace(/\s+ON\s+\w+\s*(?:;|$)/gim, ';')

  // ── Step 23: Remove CREATE INDEX statements entirely
  s = s.replace(/^\s*CREATE\s+(?:UNIQUE\s+)?(?:CLUSTERED\s+)?(?:NONCLUSTERED\s+)?INDEX\s+\w+\s+ON[\s\S]*?;/gim, '')

  // ── Step 24: Remove ALTER TABLE statements (foreign keys, constraints)
  s = s.replace(/^\s*ALTER\s+TABLE[\s\S]*?;/gim, '')

  // ── Step 25: Remove EXEC / EXECUTE statements
  s = s.replace(/^\s*(?:EXEC|EXECUTE)\s+.*$/gim, '')

  // ── Step 26: Clean trailing commas before closing paren
  s = s.replace(/,(\s*\r?\n\s*\))/g, '$1')

  // ── Step 27: Fix N'string' → 'string' (Unicode string literals)
  s = s.replace(/\bN'([^']*)'/g, "'$1'")

  // ── Step 28: Remove CLUSTERED / NONCLUSTERED keywords
  s = s.replace(/\b(?:CLUSTERED|NONCLUSTERED)\b\s*/gi, '')

  // ── Step 29: Clean multiple blank lines
  s = s.replace(/\n{3,}/g, '\n\n').trim()

  return { processed: s, dbName, skipped: [...new Set(skipped)] }
}

// ─── Import helpers ───────────────────────────────────────────────────────────

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const parseRow = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"' && !inQuotes) { inQuotes = true; continue }
      if (ch === '"' && inQuotes && line[i + 1] === '"') { current += '"'; i++; continue }
      if (ch === '"' && inQuotes) { inQuotes = false; continue }
      if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
      current += ch
    }
    result.push(current.trim())
    return result
  }
  const headers = parseRow(lines[0])
  return lines.slice(1).map(line => {
    const values = parseRow(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

function autoCast(obj: Record<string, string>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (v === '' || v === 'NULL' || v === 'null') return [k, null]
      if (v === 'true') return [k, true]
      if (v === 'false') return [k, false]
      const n = Number(v)
      if (!isNaN(n) && v !== '') return [k, n]
      return [k, v]
    })
  )
}

export function importTableFromCSV(name: string, csvText: string) {
  const rows = parseCSV(csvText).map(autoCast)
  if (rows.length === 0) throw new Error('CSV vacío o sin datos válidos')
  _createTable(name, rows)
  persistTables()
}

export function importTableFromJSON(name: string, jsonText: string) {
  let parsed: unknown
  try { parsed = JSON.parse(jsonText) } catch { throw new Error('JSON inválido') }
  const rows = Array.isArray(parsed) ? parsed
    : (typeof parsed === 'object' && parsed !== null) ? [parsed] : null
  if (!rows) throw new Error('El JSON debe ser un array de objetos o un objeto')
  _createTable(name, rows as object[])
  persistTables()
}

export interface SQLImportResult {
  tablesCreated: string[]    // tables that didn't exist before
  tablesReferenced: string[] // all tables mentioned in CREATE TABLE (including pre-existing)
  rowsInserted: number
  errors: { statement: string; message: string }[]
  dbName: string | null
  warnings: string[]
}

// ─── SQL Import helpers (JS-native parsers, bypass alasql DML limitations) ───

interface ColumnDef { name: string; isIdentity: boolean }

function splitTopCommas(s: string): string[] {
  const parts: string[] = []; let cur = '', depth = 0, inStr = false, sc = ''
  for (const ch of s) {
    if (inStr) { cur += ch; if (ch === sc) inStr = false }
    else if (ch === "'" || ch === '"') { inStr = true; sc = ch; cur += ch }
    else if (ch === '(') { depth++; cur += ch }
    else if (ch === ')') { depth--; cur += ch }
    else if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = '' }
    else cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

function parseCreateTableStmt(sql: string): { name: string; columns: ColumnDef[] } | null {
  const m = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(([\s\S]+)\)\s*$/i)
  if (!m) return null
  const columns: ColumnDef[] = []
  for (const line of splitTopCommas(m[2])) {
    const t = line.trim()
    if (/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b/i.test(t)) continue
    const cm = t.match(/^`?(\w+)`?/)
    if (cm) columns.push({ name: cm[1], isIdentity: /\b(AUTOINCREMENT|IDENTITY|AUTO_INCREMENT)\b/i.test(t) })
  }
  return { name: m[1], columns }
}

function extractRows(valStr: string, cols: string[]): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = []
  let i = 0; const s = valStr.trim()
  while (i < s.length) {
    while (i < s.length && (s[i] === ',' || /\s/.test(s[i]))) i++
    if (i >= s.length || s[i] !== '(') { if (i < s.length) i++; continue }
    i++ // skip '('
    const vals: unknown[] = []
    while (i < s.length && s[i] !== ')') {
      while (i < s.length && /[ \t]/.test(s[i])) i++
      if (s[i] === ')') break
      if (s[i] === "'") {
        i++; let str = ''
        while (i < s.length) {
          if (s[i] === "'" && s[i + 1] === "'") { str += "'"; i += 2 }
          else if (s[i] === "'") { i++; break }
          else str += s[i++]
        }
        vals.push(str)
      } else if (/^NULL\b/i.test(s.slice(i))) {
        vals.push(null); i += 4
      } else {
        let lit = ''
        while (i < s.length && s[i] !== ',' && s[i] !== ')') lit += s[i++]
        lit = lit.trim()
        const n = Number(lit)
        vals.push(lit !== '' && !isNaN(n) ? n : lit || null)
      }
      while (i < s.length && /[ \t]/.test(s[i])) i++
      if (i < s.length && s[i] === ',') i++
    }
    if (i < s.length && s[i] === ')') i++
    const row: Record<string, unknown> = {}
    cols.forEach((c, j) => { row[c] = vals[j] ?? null })
    rows.push(row)
  }
  return rows
}

function parseInsertStmt(
  sql: string,
  tableColDefs: Record<string, ColumnDef[]>,
): { tableName: string; cols: string[]; rows: Record<string, unknown>[] } | null {
  const withCols = sql.match(/^INSERT\s+INTO\s+`?(\w+)`?\s*\(([^)]+)\)\s+VALUES\s+([\s\S]+)$/i)
  if (withCols) {
    const cols = withCols[2].split(',').map(c => c.trim().replace(/`/g, ''))
    return { tableName: withCols[1], cols, rows: extractRows(withCols[3], cols) }
  }
  const noCols = sql.match(/^INSERT\s+INTO\s+`?(\w+)`?\s+VALUES\s+([\s\S]+)$/i)
  if (noCols) {
    const cols = (tableColDefs[noCols[1]] ?? []).map(c => c.name)
    return { tableName: noCols[1], cols, rows: extractRows(noCols[2], cols) }
  }
  return null
}

// ─── Extract original CREATE TABLE blocks from raw SQL ───────────────────────

// Reuses splitSQLStatements on a lightly preprocessed copy to reliably capture
// original CREATE TABLE blocks (original types, IDENTITY, FOREIGN KEY intact).
function extractRawCreateStatements(rawSQL: string): Record<string, string> {
  const result: Record<string, string> = {}
  // Only strip block comments and GO — keep everything else (types, IDENTITY, etc.)
  const s = rawSQL
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*GO\s*$/gim, '')

  for (const stmt of splitSQLStatements(s)) {
    // Find the first non-comment line to detect statement type
    const firstCode = stmt.split('\n')
      .find(l => l.trim() && !l.trim().startsWith('--'))?.trim() ?? ''
    const m = firstCode.match(/^CREATE\s+TABLE\s+\[?(\w+)\]?/i)
    if (m) result[m[1]] = stmt.trim()
  }
  return result
}

export function importTableFromSQL(sql: string): SQLImportResult {
  const { processed, dbName, skipped } = preprocessSQL(sql)

  // Capture original DDL before preprocessing changes column types
  const rawCreateStatements = extractRawCreateStatements(sql)

  const tablesReferenced = [...processed.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/gi)]
    .map(m => m[1])
    .filter((v, i, a) => a.indexOf(v) === i)

  // Drop existing tables so re-import is always clean
  for (const name of tablesReferenced) {
    try { alasql(`DROP TABLE IF EXISTS \`${name}\``) } catch { /* ignore */ }
  }

  const tablesBefore = new Set(getAllTableInfos().map(t => t.name))
  const tablesCreated: string[] = []
  const tableColDefs: Record<string, ColumnDef[]> = {}
  const autoIncrCounters: Record<string, number> = {}
  let rowsInserted = 0
  const errors: { statement: string; message: string }[] = []

  for (const stmt of splitSQLStatements(processed)) {
    const clean = stmt.trim()
    if (!clean) continue

    // Strip leading line comments (-- ...) before detecting the statement type
    // Comments grouped with a statement (e.g. "-- Tabla: X\nCREATE TABLE X") would
    // otherwise cause the startsWith('--') guard to skip the entire statement.
    const exec = clean.split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim()
    if (!exec) continue

    // ── CREATE TABLE: parse schema, create empty table in alasql
    if (/^CREATE\s+TABLE/i.test(exec)) {
      const parsed = parseCreateTableStmt(exec)
      if (!parsed) continue
      tableColDefs[parsed.name] = parsed.columns
      autoIncrCounters[parsed.name] = 0
      try {
        alasql(`CREATE TABLE \`${parsed.name}\``)
        if (!tablesBefore.has(parsed.name) && !tablesCreated.includes(parsed.name)) {
          tablesCreated.push(parsed.name)
          tablesBefore.add(parsed.name)
        }
      } catch { /* ignore */ }
      continue
    }

    // ── INSERT INTO: parse in JS and inject directly — no alasql DML limitations
    if (/^INSERT\s+INTO/i.test(exec)) {
      try {
        const parsed = parseInsertStmt(exec, tableColDefs)
        if (!parsed) continue
        const { tableName, cols, rows } = parsed
        const identityCol = (tableColDefs[tableName] ?? []).find(
          c => c.isIdentity && !cols.includes(c.name)
        )
        const tbl = (alasql as any).tables[tableName]
        if (!tbl) { errors.push({ statement: clean.substring(0, 80), message: `Tabla '${tableName}' no existe` }); continue }
        tbl.data = tbl.data ?? []
        for (const row of rows) {
          if (identityCol) {
            autoIncrCounters[tableName] = (autoIncrCounters[tableName] ?? 0) + 1
            row[identityCol.name] = autoIncrCounters[tableName]
          }
          tbl.data.push(row)
          rowsInserted++
        }
      } catch (e: any) {
        errors.push({ statement: clean.substring(0, 80) + '...', message: e?.message ?? String(e) })
      }
      continue
    }

    // ── Everything else (CREATE INDEX, ALTER TABLE, etc.) → skip silently
  }

  persistTables()

  // Save schema metadata for high-fidelity export
  if (tablesReferenced.length > 0) {
    const schema: SchemaEntry = {
      dbName: dbName ?? 'MyDatabase',
      tableOrder: tablesReferenced,
      createStatements: rawCreateStatements,
      identityCols: Object.fromEntries(
        Object.entries(tableColDefs).map(([name, cols]) => [
          name, cols.find(c => c.isIdentity)?.name ?? null,
        ])
      ),
      insertCols: Object.fromEntries(
        Object.entries(tableColDefs).map(([name, cols]) => [
          name, cols.filter(c => !c.isIdentity).map(c => c.name),
        ])
      ),
    }
    idbSaveSchema(schema).catch(() => { /* ignore */ })
  }

  return { tablesCreated, tablesReferenced, rowsInserted, errors, dbName, warnings: skipped }
}

/** Split SQL into individual statements, respecting parentheses and string literals */
function splitSQLStatements(sql: string): string[] {
  const stmts: string[] = []
  let current = ''
  let depth = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    if (inString) {
      current += ch
      if (ch === stringChar && sql[i + 1] !== stringChar) inString = false
      else if (ch === stringChar) { current += sql[++i]; } // escaped quote
      continue
    }
    if (ch === "'" || ch === '"') { inString = true; stringChar = ch; current += ch; continue }
    if (ch === '(') { depth++; current += ch; continue }
    if (ch === ')') { depth--; current += ch; continue }
    if (ch === ';' && depth === 0) {
      const s = current.trim()
      if (s) stmts.push(s)
      current = ''
      continue
    }
    current += ch
  }
  const last = current.trim()
  if (last) stmts.push(last)
  return stmts
}

// ─── Query execution ──────────────────────────────────────────────────────────

export async function executeSQL(
  query: string,
  networkLatency = 10,
  simulateErrors = false,
  errorProbability = 0,
): Promise<QueryResult> {
  const start = performance.now()
  await new Promise(r => setTimeout(r, networkLatency))

  if (simulateErrors && Math.random() * 100 < errorProbability)
    throw new Error(`Simulated error: connection timeout after ${networkLatency}ms`)

  // Preprocess: strip GO, CREATE DATABASE, USE, SQL Server specifics so all
  // tables land in alasql's default namespace where getAllTableInfos() can see them.
  const { processed } = preprocessSQL(query)
  const clean = processed.trim().replace(/;+\s*$/, '')
  if (!clean) throw new Error('La consulta está vacía')

  let raw: unknown
  try { raw = alasql(clean) }
  catch (e: any) { throw new Error(e?.message ?? 'Error al ejecutar la consulta') }

  const elapsed = performance.now() - start - networkLatency
  const isDDL = /^\s*(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE)\s/i.test(clean)
  if (isDDL) persistTables()

  if (Array.isArray(raw)) {
    const rows = raw as Record<string, unknown>[]
    return { columns: rows.length > 0 ? Object.keys(rows[0]) : [], rows, rowCount: rows.length, executionTime: Math.max(elapsed, 1), memoryUsage: +(Math.random() * 2 + 1).toFixed(2), warnings: 0 }
  }
  if (typeof raw === 'number') {
    return { columns: ['filas_afectadas'], rows: [{ filas_afectadas: raw }], rowCount: raw, executionTime: Math.max(elapsed, 1), memoryUsage: 0.5, warnings: 0 }
  }
  return { columns: ['resultado'], rows: [{ resultado: JSON.stringify(raw) }], rowCount: 1, executionTime: Math.max(elapsed, 1), memoryUsage: 0.5, warnings: 0 }
}

export function executeMongoQuery(query: string): QueryResult {
  const start = performance.now()
  const firstLine = query.trim().split('\n')[0]
  const findMatch = firstLine.match(/db\.(\w+)\.find\(/)
  let rows: Record<string, unknown>[] = []

  if (findMatch) {
    const col = findMatch[1]
    const tableData = (alasql as any).tables?.[col]?.data ?? []
    rows = (tableData as object[]).map((r, i) => ({ _id: `ObjectId("${String(i + 1).padStart(24, '0')}")`, ...r }))
  } else {
    rows = [{ mensaje: 'Comando MongoDB ejecutado correctamente', documentos: 0 }]
  }

  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  return { columns, rows, rowCount: rows.length, executionTime: performance.now() - start, memoryUsage: 1.2, warnings: 0 }
}

export function executeRedisCommand(query: string): QueryResult {
  const start = performance.now()
  const store: Record<string, unknown> = {
    'producto:1': JSON.stringify({ id: 1, nombre: 'Laptop Gamer', precio: 1200, stock: 15 }),
    'producto:2': JSON.stringify({ id: 2, nombre: 'Teclado Mecánico', precio: 45, stock: 50 }),
    'sesion:usuario:1': { username: 'juan_perez', expires: '2024-04-15', token: 'abc123xyz' },
    'sesion:usuario:2': { username: 'maria_lopez', expires: '2024-04-16', token: 'def456uvw' },
    'contador:visitas': '1542',
    'config:app': { version: '2.1.0', env: 'production', debug: 'false' },
  }
  const rows: Record<string, unknown>[] = []
  for (const line of query.trim().split('\n').filter(l => l.trim())) {
    const parts = line.trim().split(/\s+/)
    const cmd = parts[0].toUpperCase()
    const key = parts[1] ?? ''
    switch (cmd) {
      case 'KEYS': {
        const pat = parts[1] ?? '*'
        const keys = pat === '*' ? Object.keys(store) : Object.keys(store).filter(k => k.includes(pat.replace(/\*/g, '')))
        rows.push({ comando: line.trim(), tipo: 'array', resultado: keys.join(', ') }); break
      }
      case 'GET': rows.push({ comando: line.trim(), tipo: 'string', resultado: String(store[key] ?? '(nil)') }); break
      case 'SET': rows.push({ comando: line.trim(), tipo: 'status', resultado: 'OK' }); break
      case 'DEL': rows.push({ comando: line.trim(), tipo: 'integer', resultado: '(integer) 1' }); break
      case 'HGETALL': {
        const h = store[key]
        if (h && typeof h === 'object' && !Array.isArray(h))
          for (const [f, v] of Object.entries(h as Record<string, string>))
            rows.push({ comando: key, tipo: 'hash', campo: f, valor: v })
        else rows.push({ comando: line.trim(), tipo: 'hash', campo: '-', valor: '(empty)' })
        break
      }
      default: rows.push({ comando: line.trim(), tipo: 'status', resultado: `${cmd}: OK` })
    }
  }
  const columns = rows.length > 0 ? Object.keys(rows[0]) : ['comando', 'resultado']
  return { columns, rows, rowCount: rows.length, executionTime: performance.now() - start, memoryUsage: 0.3, warnings: 0 }
}
