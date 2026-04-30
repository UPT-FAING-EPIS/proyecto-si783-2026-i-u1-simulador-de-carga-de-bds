export type EngineType = 'sqlserver' | 'mysql' | 'postgresql' | 'mongodb' | 'oracle' | 'sqlite' | 'redis'
export type IsolationLevel = 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE'

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTime: number
  memoryUsage: number
  warnings: number
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

export interface EngineTab {
  id: string
  engine: EngineType
  database: string
  connection: string
  query: string
  results: QueryResult | null
  messages: string[]
}

export interface EngineConfig {
  type: EngineType
  name: string
  color: string
  emoji: string
  defaultDatabase: string
  defaultConnection: string
  defaultQuery: string
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
  },
  mysql: {
    type: 'mysql',
    name: 'MySQL',
    color: '#4479a1',
    emoji: '🐬',
    defaultDatabase: '',
    defaultConnection: 'localhost:3306',
    defaultQuery: '',
  },
  postgresql: {
    type: 'postgresql',
    name: 'PostgreSQL',
    color: '#336791',
    emoji: '🐘',
    defaultDatabase: '',
    defaultConnection: 'localhost:5432',
    defaultQuery: '',
  },
  mongodb: {
    type: 'mongodb',
    name: 'MongoDB',
    color: '#47a248',
    emoji: '🍃',
    defaultDatabase: '',
    defaultConnection: 'localhost:27017',
    defaultQuery: '',
  },
  oracle: {
    type: 'oracle',
    name: 'Oracle',
    color: '#f80000',
    emoji: '🔶',
    defaultDatabase: '',
    defaultConnection: 'localhost:1521',
    defaultQuery: '',
  },
  sqlite: {
    type: 'sqlite',
    name: 'SQLite',
    color: '#0085CA',
    emoji: '💎',
    defaultDatabase: '',
    defaultConnection: 'tienda.db',
    defaultQuery: '',
  },
  redis: {
    type: 'redis',
    name: 'Redis',
    color: '#dc382d',
    emoji: '⚡',
    defaultDatabase: '',
    defaultConnection: 'localhost:6379',
    defaultQuery: '',
  },
}
