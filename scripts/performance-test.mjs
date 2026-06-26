import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

const REPORT_DIR = 'reports'
const REPORT_JSON = `${REPORT_DIR}/performance-report.json`
const REPORT_MD = `${REPORT_DIR}/performance-report.md`
const packageInfo = readPackageInfo()

const scenarioPresets = {
  light: {
    name: 'Light',
    totalQueries: 120,
    concurrency: 12,
    thresholdFactor: { latency: 0.85, p95: 0.85, tps: 0.65 },
  },
  medium: {
    name: 'Medium',
    totalQueries: 240,
    concurrency: 24,
    thresholdFactor: { latency: 1, p95: 1, tps: 1 },
  },
  heavy: {
    name: 'Heavy',
    totalQueries: 600,
    concurrency: 60,
    thresholdFactor: { latency: 1.5, p95: 1.55, tps: 1.2 },
  },
}

const engineThresholds = {
  sqlserver: { maxAvgLatencyMs: 120, maxP95LatencyMs: 180, minTps: 120, maxErrorRate: 0.03 },
  mysql: { maxAvgLatencyMs: 115, maxP95LatencyMs: 175, minTps: 130, maxErrorRate: 0.03 },
  postgresql: { maxAvgLatencyMs: 115, maxP95LatencyMs: 175, minTps: 135, maxErrorRate: 0.03 },
  oracle: { maxAvgLatencyMs: 120, maxP95LatencyMs: 180, minTps: 120, maxErrorRate: 0.03 },
  sqlite: { maxAvgLatencyMs: 170, maxP95LatencyMs: 240, minTps: 80, maxErrorRate: 0.04 },
  mongodb: { maxAvgLatencyMs: 105, maxP95LatencyMs: 160, minTps: 150, maxErrorRate: 0.03 },
  redis: { maxAvgLatencyMs: 90, maxP95LatencyMs: 140, minTps: 200, maxErrorRate: 0.025 },
}

const selectedScenario = envString('PERF_SCENARIO', 'medium')
const scenario = scenarioPresets[selectedScenario]

if (!scenario) {
  const supported = Object.keys(scenarioPresets).join(', ')
  throw new Error(`Escenario no soportado: ${selectedScenario}. Escenarios disponibles: ${supported}`)
}

const config = {
  engine: envString('PERF_ENGINE', 'sqlserver'),
  scenario: selectedScenario,
  totalQueries: envNumber('PERF_TOTAL_QUERIES', scenario.totalQueries),
  concurrency: envNumber('PERF_CONCURRENCY', scenario.concurrency),
}

const profiles = loadEngineProfiles()
const profile = profiles[config.engine]

if (!profile) {
  const supported = Object.keys(profiles).join(', ')
  throw new Error(`Motor no soportado: ${config.engine}. Motores disponibles: ${supported}`)
}

const thresholds = resolveThresholds(config.engine, scenario)
const settings = { ...config, thresholds }
const seed = hash(`${config.engine}:${config.scenario}:${config.totalQueries}:${config.concurrency}`)
const random = createRandom(seed)
const result = await runLoadSimulation(profile, settings, random)
const report = buildReport(profile, settings, result)

mkdirSync(REPORT_DIR, { recursive: true })
writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`)
writeFileSync(REPORT_MD, renderMarkdown(report))

console.log(renderConsoleSummary(report))

if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, renderMarkdown(report))
}

if (!report.passed) {
  throw new Error(`Prueba de rendimiento fallida: ${report.failures.join('; ')}`)
}

function envString(name, fallback) {
  return process.env[name]?.trim() || fallback
}

function envNumber(name, fallback) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function resolveThresholds(engine, scenarioConfig) {
  const base = engineThresholds[engine] ?? engineThresholds.sqlserver
  return {
    maxAvgLatencyMs: envNumber(
      'PERF_MAX_AVG_LATENCY_MS',
      Math.round(base.maxAvgLatencyMs * scenarioConfig.thresholdFactor.latency),
    ),
    maxP95LatencyMs: envNumber(
      'PERF_MAX_P95_LATENCY_MS',
      Math.round(base.maxP95LatencyMs * scenarioConfig.thresholdFactor.p95),
    ),
    maxErrorRate: envNumber('PERF_MAX_ERROR_RATE', base.maxErrorRate),
    minTps: envNumber('PERF_MIN_TPS', Math.round(base.minTps * scenarioConfig.thresholdFactor.tps)),
  }
}

function loadEngineProfiles() {
  const fallback = {
    sqlserver: { key: 'sqlserver', name: 'SQL Server', perfFactor: 1.0 },
    mysql: { key: 'mysql', name: 'MySQL', perfFactor: 1.1 },
    postgresql: { key: 'postgresql', name: 'PostgreSQL', perfFactor: 1.15 },
    mongodb: { key: 'mongodb', name: 'MongoDB', perfFactor: 1.3 },
    oracle: { key: 'oracle', name: 'Oracle', perfFactor: 1.05 },
    sqlite: { key: 'sqlite', name: 'SQLite', perfFactor: 0.6 },
    redis: { key: 'redis', name: 'Redis', perfFactor: 1.8 },
  }

  try {
    const typesPath = resolve('src/types.ts')
    const source = readFileSync(typesPath, 'utf8')
    const profiles = {}
    const blockPattern = /(\w+):\s*\{([\s\S]*?)\n\s*\}/g

    for (const match of source.matchAll(blockPattern)) {
      const [, key, block] = match
      const name = block.match(/name:\s*'([^']+)'/)?.[1]
      const perfFactor = Number(block.match(/perfFactor:\s*([0-9.]+)/)?.[1])

      if (name && Number.isFinite(perfFactor)) {
        profiles[key] = { key, name, perfFactor }
      }
    }

    return Object.keys(profiles).length > 0 ? profiles : fallback
  } catch {
    return fallback
  }
}

async function runLoadSimulation(profile, settings, random) {
  const latencies = []
  let errors = 0
  let completed = 0
  let cursor = 0
  const startedAt = performance.now()
  const workers = Array.from({ length: settings.concurrency }, async () => {
    while (cursor < settings.totalQueries) {
      const current = cursor++
      const queryResult = await executeSimulatedQuery(profile, settings, random, current)
      completed++
      latencies.push(queryResult.latencyMs)
      if (!queryResult.success) errors++
    }
  })

  await Promise.all(workers)
  const durationMs = performance.now() - startedAt

  latencies.sort((a, b) => a - b)

  return {
    completed,
    errors,
    durationMs,
    avgLatencyMs: average(latencies),
    p95LatencyMs: percentile(latencies, 95),
    maxLatencyMs: latencies.at(-1) ?? 0,
    tps: completed / (durationMs / 1000),
    errorRate: errors / completed,
  }
}

async function executeSimulatedQuery(profile, settings, random, index) {
  const pressure = Math.max(settings.concurrency / 20, 1)
  const baseLatency = 26 / profile.perfFactor
  const pressurePenalty = Math.log2(pressure) * 6
  const jitter = random() * 32
  const writePenalty = index % 5 === 0 ? 8 / profile.perfFactor : 0
  const latencyMs = baseLatency + pressurePenalty + jitter + writePenalty
  const errorProbability = Math.min(0.002 + pressure * 0.0015 / profile.perfFactor, 0.02)

  await sleep(latencyMs)

  return {
    latencyMs,
    success: random() > errorProbability,
  }
}

function buildReport(profile, settings, result) {
  const failures = []

  if (result.avgLatencyMs > settings.thresholds.maxAvgLatencyMs) {
    failures.push(`latencia promedio ${format(result.avgLatencyMs)}ms > ${settings.thresholds.maxAvgLatencyMs}ms`)
  }

  if (result.p95LatencyMs > settings.thresholds.maxP95LatencyMs) {
    failures.push(`p95 ${format(result.p95LatencyMs)}ms > ${settings.thresholds.maxP95LatencyMs}ms`)
  }

  if (result.errorRate > settings.thresholds.maxErrorRate) {
    failures.push(`tasa de errores ${formatPercent(result.errorRate)} > ${formatPercent(settings.thresholds.maxErrorRate)}`)
  }

  if (result.tps < settings.thresholds.minTps) {
    failures.push(`TPS ${format(result.tps)} < ${settings.thresholds.minTps}`)
  }

  return {
    generatedAt: new Date().toISOString(),
    simulatorVersion: packageInfo.version,
    repository: envString('GITHUB_REPOSITORY', 'local'),
    branch: envString('GITHUB_REF_NAME', 'local'),
    commit: envString('GITHUB_SHA', 'local'),
    engine: profile,
    settings,
    metrics: {
      totalQueries: result.completed,
      errors: result.errors,
      durationMs: Number(result.durationMs.toFixed(2)),
      avgLatencyMs: Number(result.avgLatencyMs.toFixed(2)),
      p95LatencyMs: Number(result.p95LatencyMs.toFixed(2)),
      maxLatencyMs: Number(result.maxLatencyMs.toFixed(2)),
      tps: Number(result.tps.toFixed(2)),
      errorRate: Number(result.errorRate.toFixed(4)),
    },
    passed: failures.length === 0,
    failures,
  }
}

function renderMarkdown(report) {
  const status = report.passed ? 'PASS' : 'FAIL'

  return `# Performance Report

**Status:** ${status}

| Field | Value |
|---|---:|
| Generated at | ${report.generatedAt} |
| Simulator version | ${report.simulatorVersion} |
| Branch | ${report.branch} |
| Commit | ${shortCommit(report.commit)} |

| Metric | Value | Threshold |
|---|---:|---:|
| Engine | ${report.engine.name} | - |
| Scenario | ${report.settings.scenario} | - |
| Total queries | ${report.metrics.totalQueries} | - |
| Concurrency | ${report.settings.concurrency} | - |
| Total duration | ${format(report.metrics.durationMs)} ms | - |
| Average latency | ${format(report.metrics.avgLatencyMs)} ms | <= ${report.settings.thresholds.maxAvgLatencyMs} ms |
| P95 latency | ${format(report.metrics.p95LatencyMs)} ms | <= ${report.settings.thresholds.maxP95LatencyMs} ms |
| Max latency | ${format(report.metrics.maxLatencyMs)} ms | - |
| TPS | ${format(report.metrics.tps)} | >= ${report.settings.thresholds.minTps} |
| Error rate | ${formatPercent(report.metrics.errorRate)} | <= ${formatPercent(report.settings.thresholds.maxErrorRate)} |

${report.failures.length > 0 ? `## Failures\n\n${report.failures.map(item => `- ${item}`).join('\n')}\n` : 'No threshold violations detected.\n'}
`
}

function renderConsoleSummary(report) {
  return [
    `Performance status: ${report.passed ? 'PASS' : 'FAIL'}`,
    `Engine: ${report.engine.name}`,
    `Scenario: ${report.settings.scenario}`,
    `Version: ${report.simulatorVersion}`,
    `Branch: ${report.branch}`,
    `Commit: ${shortCommit(report.commit)}`,
    `Queries: ${report.metrics.totalQueries}`,
    `Concurrency: ${report.settings.concurrency}`,
    `Duration: ${format(report.metrics.durationMs)}ms`,
    `Average latency: ${format(report.metrics.avgLatencyMs)}ms`,
    `P95 latency: ${format(report.metrics.p95LatencyMs)}ms`,
    `TPS: ${format(report.metrics.tps)}`,
    `Error rate: ${formatPercent(report.metrics.errorRate)}`,
    `Report: ${REPORT_MD}`,
  ].join('\n')
}

function average(values) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length
}

function percentile(values, p) {
  if (values.length === 0) return 0
  const index = Math.ceil((p / 100) * values.length) - 1
  return values[Math.min(Math.max(index, 0), values.length - 1)]
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function format(value) {
  return Number(value).toFixed(2)
}

function formatPercent(value) {
  return `${(Number(value) * 100).toFixed(2)}%`
}

function hash(value) {
  let output = 2166136261
  for (let i = 0; i < value.length; i++) {
    output ^= value.charCodeAt(i)
    output = Math.imul(output, 16777619)
  }
  return output >>> 0
}

function createRandom(seed) {
  let state = seed || 1
  return () => {
    state = Math.imul(1664525, state) + 1013904223
    return (state >>> 0) / 4294967296
  }
}

function readPackageInfo() {
  try {
    return JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
  } catch {
    return { version: 'unknown' }
  }
}

function shortCommit(commit) {
  return commit === 'local' ? commit : commit.slice(0, 7)
}
