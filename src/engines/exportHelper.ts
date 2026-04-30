import type { SchemaEntry } from '../db/idbStorage'
import type { TableInfo } from './sqlEngine'

type EngineType = 'sqlserver' | 'mysql' | 'postgresql' | 'sqlite' | 'oracle' | 'mongodb' | 'redis'

// ─── DDL transformer ──────────────────────────────────────────────────────────

function transformDDL(original: string, engine: EngineType): string {
  let s = original.replace(/\r\n/g, '\n').trim()

  switch (engine) {

    case 'sqlserver':
      // Already SQL Server format — keep as-is
      return s.endsWith(';') ? s : s + ';'

    case 'mysql': {
      s = s.replace(/\[([^\]]+)\]/g, '`$1`')                          // [name] → `name`
      s = s.replace(/\b(CREATE\s+TABLE)\s+`?(\w+)`?/i,                // wrap table name
        (_m, ct, n) => `${ct} \`${n}\``)
      s = s.replace(/\bIDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi,        // IDENTITY → AUTO_INCREMENT
        'AUTO_INCREMENT')
      s = s.replace(/\bNVARCHAR\b/gi, 'VARCHAR')
      s = s.replace(/\bNTEXT\b/gi,    'LONGTEXT')
      s = s.replace(/\bDATETIMEOFFSET(\s*\(\d+\))?\b/gi, 'DATETIME')
      s = s.replace(/\bSMALLDATETIME\b/gi, 'DATETIME')
      s = s.replace(/\bBIT\b/gi, 'TINYINT(1)')
      s = s.replace(/\bMONEY\b/gi, 'DECIMAL(19,4)')
      s = s.replace(/\bUNIQUEIDENTIFIER\b/gi, 'VARCHAR(36)')
      s = s.replace(/\bXML\b/gi, 'LONGTEXT')
      // Replace column names in FOREIGN KEY with backticks
      s = s.replace(/\bFOREIGN KEY\s*\((\w+)\)/gi, 'FOREIGN KEY (`$1`)')
      s = s.replace(/\bREFERENCES\s+(\w+)\s*\((\w+)\)/gi, 'REFERENCES `$1`(`$2`)')
      // Remove trailing ) and add ENGINE=InnoDB
      s = s.replace(/\)\s*;?\s*$/, ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;')
      return s
    }

    case 'postgresql': {
      s = s.replace(/\[([^\]]+)\]/g, '"$1"')
      s = s.replace(/\b(CREATE\s+TABLE)\s+"?(\w+)"?/i,
        (_m, ct, n) => `${ct} "${n}"`)
      // INT/BIGINT IDENTITY → SERIAL/BIGSERIAL
      s = s.replace(/\bBIGINT\b([^,\n)]*)\bIDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'BIGSERIAL$1')
      s = s.replace(/\b(?:INT|INTEGER|SMALLINT|TINYINT)\b([^,\n)]*)\bIDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'SERIAL$1')
      s = s.replace(/\bNVARCHAR\b/gi, 'VARCHAR')
      s = s.replace(/\bNTEXT\b/gi,    'TEXT')
      s = s.replace(/\bDATETIME\b/gi, 'TIMESTAMP')
      s = s.replace(/\bSMALLDATETIME\b/gi, 'TIMESTAMP')
      s = s.replace(/\bBIT\b/gi, 'BOOLEAN')
      s = s.replace(/\bMONEY\b/gi, 'DECIMAL(19,4)')
      s = s.replace(/\bUNIQUEIDENTIFIER\b/gi, 'UUID')
      s = s.replace(/\bXML\b/gi, 'TEXT')
      s = s.replace(/\bFOREIGN KEY\s*\((\w+)\)/gi, 'FOREIGN KEY ("$1")')
      s = s.replace(/\bREFERENCES\s+(\w+)\s*\((\w+)\)/gi, 'REFERENCES "$1"("$2")')
      return s.endsWith(';') ? s : s + ';'
    }

    case 'sqlite': {
      s = s.replace(/\[([^\]]+)\]/g, '$1')
      s = s.replace(/^CREATE\s+TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS ')
      // INT IDENTITY → INTEGER PRIMARY KEY AUTOINCREMENT
      s = s.replace(/\b(?:INT|BIGINT|SMALLINT|TINYINT)\b([^,\n)]*?)\bIDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi,
        'INTEGER$1AUTOINCREMENT')
      s = s.replace(/\bNVARCHAR(\s*\(\d+\))?\b/gi, 'TEXT')
      s = s.replace(/\bVARCHAR(\s*\(\d+\))?\b/gi, 'TEXT')
      s = s.replace(/\bDECIMAL(\s*\(\d+,\d+\))?\b/gi, 'REAL')
      s = s.replace(/\bFLOAT\b|\bDOUBLE\b/gi, 'REAL')
      s = s.replace(/\bDATETIME\b|\bDATE\b|\bTIMESTAMP\b/gi, 'TEXT')
      s = s.replace(/\bBIT\b/gi, 'INTEGER')
      s = s.replace(/\bMONEY\b/gi, 'REAL')
      // Remove FOREIGN KEY (SQLite parses but doesn't enforce by default)
      s = s.replace(/,?\s*\bFOREIGN KEY\b[^,\n)]*(?:\n\s*)?/gi, '')
      return s.endsWith(';') ? s : s + ';'
    }

    case 'oracle': {
      s = s.replace(/\[([^\]]+)\]/g, '"$1"')
      s = s.replace(/\b(CREATE\s+TABLE)\s+"?(\w+)"?/i,
        (_m, ct, n) => `${ct} "${n}"`)
      s = s.replace(/\b(?:INT|INTEGER|SMALLINT|TINYINT)\b/gi, 'NUMBER')
      s = s.replace(/\bBIGINT\b/gi, 'NUMBER(19)')
      s = s.replace(/\bIDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'GENERATED ALWAYS AS IDENTITY')
      s = s.replace(/\bNVARCHAR\b/gi, 'NVARCHAR2')
      s = s.replace(/\bVARCHAR\b/gi, 'VARCHAR2')
      s = s.replace(/\bNTEXT\b|\bTEXT\b/gi, 'CLOB')
      s = s.replace(/\bDATETIME\b/gi, 'TIMESTAMP')
      s = s.replace(/\bBIT\b/gi, 'NUMBER(1)')
      s = s.replace(/\bMONEY\b/gi, 'NUMBER(19,4)')
      s = s.replace(/\bFOREIGN KEY\s*\((\w+)\)/gi, 'FOREIGN KEY ("$1")')
      s = s.replace(/\bREFERENCES\s+(\w+)\s*\((\w+)\)/gi, 'REFERENCES "$1"("$2")')
      return s.endsWith(';') ? s : s + ';'
    }

    default:
      return s
  }
}

// ─── Identifier quoting ───────────────────────────────────────────────────────

function quoteId(name: string, engine: EngineType): string {
  if (engine === 'mysql')      return `\`${name}\``
  if (engine === 'postgresql') return `"${name}"`
  if (engine === 'oracle')     return `"${name}"`
  return name
}

// ─── Value formatting ─────────────────────────────────────────────────────────

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  return `'${String(v).replace(/'/g, "''")}'`
}

// ─── Database / USE header ────────────────────────────────────────────────────

function dbHeader(dbName: string, engine: EngineType): string[] {
  switch (engine) {
    case 'sqlserver':
      return ['-- Crear base de datos', `CREATE DATABASE ${dbName};`, 'GO', '',
              `USE ${dbName};`, 'GO', '']
    case 'mysql':
      return [`CREATE DATABASE IF NOT EXISTS \`${dbName}\``,
              '  DEFAULT CHARACTER SET utf8mb4',
              '  DEFAULT COLLATE utf8mb4_unicode_ci;',
              `USE \`${dbName}\`;`, '']
    case 'postgresql':
      return [`CREATE DATABASE "${dbName}";`,
              `\\c "${dbName}"`, '']
    case 'sqlite':
      return [`-- SQLite: base de datos en archivo ${dbName}.db`,
              `-- No requiere CREATE DATABASE ni USE`, '']
    case 'oracle':
      return [`-- Oracle: conectar al esquema ${dbName}`,
              `ALTER SESSION SET CURRENT_SCHEMA = ${dbName};`, '']
    default:
      return []
  }
}

// ─── SQL INSERT builder ───────────────────────────────────────────────────────

function buildInserts(
  tableName: string,
  insertCols: string[],
  rows: Record<string, unknown>[],
  engine: EngineType,
): string[] {
  if (rows.length === 0 || insertCols.length === 0) return []
  const tbl  = quoteId(tableName, engine)
  const cols = insertCols.map(c => quoteId(c, engine)).join(', ')

  if (engine === 'oracle') {
    // Oracle (pre-12.1 style): one INSERT per row for safety
    return rows.map(r => {
      const vals = insertCols.map(c => fmtVal(r[c])).join(', ')
      return `INSERT INTO ${tbl} (${cols}) VALUES (${vals});`
    })
  }

  // Multi-row INSERT for all other SQL engines
  const valueRows = rows.map((r, i) => {
    const vals = insertCols.map(c => fmtVal(r[c])).join(', ')
    return `(${vals})${i < rows.length - 1 ? ',' : ';'}`
  })
  return [`INSERT INTO ${tbl} (${cols}) VALUES`, ...valueRows]
}

// ─── MongoDB export ───────────────────────────────────────────────────────────

function mongoExport(
  dbName: string,
  orderedNames: string[],
  getData: (name: string) => { rows: Record<string, unknown>[] },
): string {
  const lines: string[] = [
    `// MongoDB export — ${dbName}`,
    `// Fecha: ${new Date().toLocaleString()}`,
    '',
    `use('${dbName}');`,
    '',
  ]
  for (const name of orderedNames) {
    const { rows } = getData(name)
    lines.push(`// Colección: ${name}`)
    lines.push(`db.createCollection('${name}');`)
    if (rows.length > 0) {
      lines.push(`db.${name}.insertMany(`)
      lines.push(JSON.stringify(rows, null, 2) + ');\n')
    } else {
      lines.push('')
    }
  }
  return lines.join('\n')
}

// ─── Redis export ─────────────────────────────────────────────────────────────

function redisExport(
  dbName: string,
  orderedNames: string[],
  getData: (name: string) => { rows: Record<string, unknown>[] },
): string {
  const lines: string[] = [
    `# Redis export — ${dbName}`,
    `# Fecha: ${new Date().toLocaleString()}`,
    '',
  ]
  for (const name of orderedNames) {
    const { rows } = getData(name)
    lines.push(`# ${name}`)
    rows.forEach((row, i) => {
      const key = `${name}:${i + 1}`
      for (const [field, val] of Object.entries(row)) {
        lines.push(`HSET ${key} ${field} ${JSON.stringify(val ?? '')}`)
      }
    })
    lines.push('')
  }
  return lines.join('\n')
}

// ─── Main export function ─────────────────────────────────────────────────────

export interface ExportResult { content: string; filename: string }

export function generateEngineExport(
  engine: EngineType,
  dbName: string,
  schema: SchemaEntry | undefined,
  orderedNames: string[],
  allTables: TableInfo[],
  getData: (name: string) => { rows: Record<string, unknown>[]; columns: string[] },
): ExportResult {
  const date = new Date().toLocaleString()

  // ── MongoDB
  if (engine === 'mongodb') {
    return {
      content: mongoExport(dbName, orderedNames, getData),
      filename: `${dbName}_mongodb.js`,
    }
  }

  // ── Redis
  if (engine === 'redis') {
    return {
      content: redisExport(dbName, orderedNames, getData),
      filename: `${dbName}_redis.txt`,
    }
  }

  // ── SQL engines ──────────────────────────────────────────────────────────────
  const engineLabels: Record<string, string> = {
    sqlserver:  'SQL Server',
    mysql:      'MySQL',
    postgresql: 'PostgreSQL',
    sqlite:     'SQLite',
    oracle:     'Oracle',
  }
  const lines: string[] = [
    `-- =============================================`,
    `-- Exportación: ${dbName}`,
    `-- Motor: ${engineLabels[engine] ?? engine}`,
    `-- Fecha: ${date}`,
    `-- Generado por: Simulador de Bases de Datos`,
    `-- =============================================`,
    '',
    ...dbHeader(dbName, engine),
  ]

  // CREATE TABLE
  for (const name of orderedNames) {
    const tableInfo = allTables.find(t => t.name === name)
    if (!tableInfo) continue

    lines.push(`-- Tabla: ${name}`)

    if (schema?.createStatements[name]) {
      lines.push(transformDDL(schema.createStatements[name], engine))
    } else {
      // Fallback: infer types from data
      const { rows } = getData(name)
      const colDefs = tableInfo.columns.map(c => {
        const sample = rows.find(r => r[c] !== null && r[c] !== undefined)?.[c]
        const t = typeof sample
        if (engine === 'sqlite') return `${c} ${t === 'number' ? 'REAL' : 'TEXT'}`
        if (engine === 'oracle') return `${quoteId(c, 'oracle')} ${t === 'number' ? 'NUMBER' : 'VARCHAR2(255)'}`
        const q = quoteId(c, engine)
        return `${q} ${t === 'number' ? 'INT' : 'VARCHAR(255)'}`
      })
      lines.push(`CREATE TABLE ${quoteId(name, engine)} (`)
      lines.push(colDefs.map(d => `    ${d}`).join(',\n'))
      lines.push(engine === 'mysql'
        ? ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;'
        : ');')
    }
    lines.push('')
  }

  // INSERT DATA
  lines.push(`-- =====================`)
  lines.push(`-- INSERTAR DATOS`)
  lines.push(`-- =====================`)
  lines.push('')

  for (const name of orderedNames) {
    const { rows, columns } = getData(name)
    if (rows.length === 0) continue

    // Determine which columns go in INSERT (exclude identity)
    const identityCol  = schema?.identityCols[name] ?? null
    const insertCols   = schema?.insertCols[name]
      ?? (identityCol ? columns.filter(c => c !== identityCol) : columns)

    lines.push(`-- ${name}`)
    lines.push(...buildInserts(name, insertCols, rows, engine))
    lines.push('')
  }

  // Test query
  const firstTable = orderedNames.find(n => allTables.some(t => t.name === n))
  if (firstTable) {
    const t = quoteId(firstTable, engine)
    lines.push(`-- =====================`)
    lines.push(`-- CONSULTA DE PRUEBA`)
    lines.push(`-- =====================`)
    lines.push('')
    lines.push(`SELECT * FROM ${t};`)
  }

  const ext = engine === 'sqlite' ? 'sql' : 'sql'
  return {
    content: '﻿' + lines.join('\n'),   // UTF-8 BOM for Windows editors
    filename: `${dbName}_${engine}.${ext}`,
  }
}
