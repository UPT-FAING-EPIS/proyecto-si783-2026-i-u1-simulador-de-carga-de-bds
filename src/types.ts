export type EngineType = 'sqlserver' | 'mysql' | 'postgresql' | 'mongodb' | 'oracle' | 'sqlite' | 'redis'
export type IsolationLevel = 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE'

export interface QueryResultSet {
  label: string
  columns: string[]
  rows: Record<string, unknown>[]
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTime: number
  memoryUsage: number
  warnings: number
  sets?: QueryResultSet[]
}

export interface QueryHistoryItem {
  id: string
  query: string
  timestamp: Date
  engine: EngineType
  rowCount: number
  executionTime: number
}

export interface SimulationSettings {
  networkLatency: number
  connectionLimit: number
  simulateErrors: boolean
  errorProbability: number
  isolationLevel: IsolationLevel
}

export interface Metrics {
  executionTime: string
  rowsAffected: number
  warnings: number
  memoryUsage: string
}

export interface QueryPane {
  id: string
  query: string
  results: QueryResult | null
  messages: string[]
}

export interface EngineTab {
  id: string
  engine: EngineType
  database: string
  connection: string
  query: string
  selectedText: string
  results: QueryResult | null
  messages: string[]
  queryPanes: QueryPane[]
  activeQueryPaneId: string
}

export interface EngineConfig {
  type: EngineType
  name: string
  color: string
  emoji: string
  defaultDatabase: string
  defaultConnection: string
  defaultQuery: string
  /** Multiplicador de capacidad relativa usado por el simulador de carga (1 = referencia) */
  perfFactor: number
}

export type ExplainStepType = 'scan' | 'join' | 'filter' | 'aggregate' | 'sort' | 'limit' | 'projection' | 'dml' | 'info'

export interface ExplainStep {
  id: number
  type: ExplainStepType
  operation: string
  table?: string
  detail: string
  estimatedRows: number
  costLevel: 'low' | 'medium' | 'high'
  note?: string
}

export interface SessionData {
  version: string
  savedAt: string
  tabs: Array<{ engine: EngineType; database: string; query: string }>
  databases: { name: string; tables: string[]; color?: string }[]
  activeDbName: string
  simulation: SimulationSettings
}

export const ENGINE_CONFIGS: Record<EngineType, EngineConfig> = {
  sqlserver: {
    type: 'sqlserver',
    name: 'SQL Server',
    color: '#e74c3c',
    emoji: '🔴',
    defaultDatabase: '',
    defaultConnection: 'localhost',
    defaultQuery: '',
    perfFactor: 1.0,
  },
  mysql: {
    type: 'mysql',
    name: 'MySQL',
    color: '#4479a1',
    emoji: '🐬',
    defaultDatabase: '',
    defaultConnection: 'localhost:3306',
    defaultQuery: '',
    perfFactor: 1.1,
  },
  postgresql: {
    type: 'postgresql',
    name: 'PostgreSQL',
    color: '#336791',
    emoji: '🐘',
    defaultDatabase: '',
    defaultConnection: 'localhost:5432',
    defaultQuery: '',
    perfFactor: 1.15,
  },
  mongodb: {
    type: 'mongodb',
    name: 'MongoDB',
    color: '#47a248',
    emoji: '🍃',
    defaultDatabase: '',
    defaultConnection: 'localhost:27017',
    defaultQuery: '',
    perfFactor: 1.3,
  },
  oracle: {
    type: 'oracle',
    name: 'Oracle',
    color: '#f80000',
    emoji: '🔶',
    defaultDatabase: '',
    defaultConnection: 'localhost:1521',
    defaultQuery: '',
    perfFactor: 1.05,
  },
  sqlite: {
    type: 'sqlite',
    name: 'SQLite',
    color: '#0085CA',
    emoji: '💎',
    defaultDatabase: '',
    defaultConnection: 'tienda.db',
    defaultQuery: '',
    perfFactor: 0.6,
  },
  redis: {
    type: 'redis',
    name: 'Redis',
    color: '#dc382d',
    emoji: '⚡',
    defaultDatabase: '',
    defaultConnection: 'localhost:6379',
    defaultQuery: '',
    perfFactor: 1.8,
  },
}
