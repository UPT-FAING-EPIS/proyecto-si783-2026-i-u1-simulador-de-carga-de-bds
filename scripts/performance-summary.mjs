import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const inputDir = process.argv[2] ?? 'reports/engines'
const outputDir = 'reports'
const outputJson = join(outputDir, 'performance-summary.json')
const outputMd = join(outputDir, 'performance-summary.md')
const outputCsv = join(outputDir, 'performance-summary.csv')

const reports = findReportFiles(inputDir)
  .map(file => JSON.parse(readFileSync(file, 'utf8')))

if (reports.length === 0) {
  throw new Error(`No se encontraron reportes de rendimiento en ${inputDir}`)
}

const summary = buildSummary(reports)

mkdirSync(outputDir, { recursive: true })
writeFileSync(outputJson, `${JSON.stringify(summary, null, 2)}\n`)
writeFileSync(outputMd, renderMarkdown(summary))
writeFileSync(outputCsv, renderCsv(summary))

console.log(renderConsoleSummary(summary))

if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, renderMarkdown(summary))
}

if (!summary.passed) {
  throw new Error(`Resumen de rendimiento fallido: ${summary.failures.join('; ')}`)
}

function findReportFiles(dir) {
  if (!existsSync(dir)) return []

  const files = []
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findReportFiles(fullPath))
      continue
    }

    if (entry.isFile() && entry.name === 'performance-report.json') {
      files.push(fullPath)
    }
  }

  return files
}

function buildSummary(reports) {
  const passed = reports.every(report => report.passed)
  const failures = reports.flatMap(report =>
    report.failures.map(failure => `${report.engine.name} (${report.settings.scenario}): ${failure}`)
  )
  const engines = reports.map(report => ({
    key: report.engine.key,
    name: report.engine.name,
    scenario: report.settings.scenario,
    status: report.passed ? 'PASS' : 'FAIL',
    totalQueries: report.metrics.totalQueries,
    concurrency: report.settings.concurrency,
    avgLatencyMs: report.metrics.avgLatencyMs,
    p95LatencyMs: report.metrics.p95LatencyMs,
    maxLatencyMs: report.metrics.maxLatencyMs,
    durationMs: report.metrics.durationMs,
    tps: report.metrics.tps,
    errorRate: report.metrics.errorRate,
  })).sort((a, b) => b.tps - a.tps)
  const engineSummary = buildEngineSummary(engines)
  const best = {
    tps: maxBy(engines, 'tps'),
    latency: minBy(engines, 'avgLatencyMs'),
    stability: mostStable(engines),
  }
  const worst = {
    tps: minBy(engines, 'tps'),
    latency: maxBy(engines, 'avgLatencyMs'),
  }

  return {
    generatedAt: new Date().toISOString(),
    simulatorVersion: reports[0]?.simulatorVersion ?? 'unknown',
    repository: reports[0]?.repository ?? 'local',
    branch: reports[0]?.branch ?? 'local',
    commit: reports[0]?.commit ?? 'local',
    passed,
    engines,
    engineSummary,
    totals: {
      engines: new Set(engines.map(engine => engine.key)).size,
      scenarios: new Set(engines.map(engine => engine.scenario)).size,
      checks: engines.length,
      totalQueries: sum(engines, 'totalQueries'),
      totalDurationMs: sum(engines, 'durationMs'),
      avgLatencyMs: average(engines.map(engine => engine.avgLatencyMs)),
      avgTps: average(engines.map(engine => engine.tps)),
      maxP95LatencyMs: Math.max(...engines.map(engine => engine.p95LatencyMs)),
      maxErrorRate: Math.max(...engines.map(engine => engine.errorRate)),
    },
    best,
    worst,
    conclusion: buildConclusion({ passed, failures, best, worst, engineSummary }),
    failures,
  }
}

function buildEngineSummary(engines) {
  const byEngine = new Map()

  for (const engine of engines) {
    const current = byEngine.get(engine.key) ?? {
      key: engine.key,
      name: engine.name,
      checks: 0,
      totalQueries: 0,
      avgLatencyValues: [],
      p95LatencyValues: [],
      tpsValues: [],
      errorRateValues: [],
      bestScenario: engine,
      status: 'PASS',
    }

    current.checks++
    current.totalQueries += engine.totalQueries
    current.avgLatencyValues.push(engine.avgLatencyMs)
    current.p95LatencyValues.push(engine.p95LatencyMs)
    current.tpsValues.push(engine.tps)
    current.errorRateValues.push(engine.errorRate)
    if (engine.tps > current.bestScenario.tps) current.bestScenario = engine
    if (engine.status !== 'PASS') current.status = 'FAIL'
    byEngine.set(engine.key, current)
  }

  return [...byEngine.values()]
    .map(engine => ({
      key: engine.key,
      name: engine.name,
      status: engine.status,
      checks: engine.checks,
      totalQueries: engine.totalQueries,
      avgLatencyMs: average(engine.avgLatencyValues),
      avgP95LatencyMs: average(engine.p95LatencyValues),
      avgTps: average(engine.tpsValues),
      avgErrorRate: average(engine.errorRateValues),
      bestScenario: engine.bestScenario.scenario,
      bestScenarioTps: engine.bestScenario.tps,
    }))
    .sort((a, b) => b.avgTps - a.avgTps)
}

function renderMarkdown(summary) {
  const status = summary.passed ? 'PASS' : 'FAIL'
  const rows = summary.engines.map(engine => [
    engine.name,
    engine.scenario,
    engine.status,
    `${format(engine.avgLatencyMs)} ms`,
    `${format(engine.p95LatencyMs)} ms`,
    `${format(engine.maxLatencyMs)} ms`,
    format(engine.tps),
    formatPercent(engine.errorRate),
    String(engine.totalQueries),
  ])
  const engineRows = summary.engineSummary.map(engine => [
    engine.name,
    engine.status,
    String(engine.checks),
    String(engine.totalQueries),
    `${format(engine.avgLatencyMs)} ms`,
    `${format(engine.avgP95LatencyMs)} ms`,
    format(engine.avgTps),
    formatPercent(engine.avgErrorRate),
    `${engine.bestScenario} (${format(engine.bestScenarioTps)} TPS)`,
  ])

  return `# Consolidated Performance Report

**Status:** ${status}

| Field | Value |
|---|---:|
| Generated at | ${summary.generatedAt} |
| Simulator version | ${summary.simulatorVersion} |
| Branch | ${summary.branch} |
| Commit | ${shortCommit(summary.commit)} |

## Automatic Conclusion

${summary.conclusion}

| Engine | Scenario | Status | Avg latency | P95 latency | Max latency | TPS | Error rate | Queries |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
${rows.map(row => `| ${row.join(' | ')} |`).join('\n')}

## Summary by Engine

| Engine | Status | Checks | Queries | Avg latency | Avg p95 | Avg TPS | Avg error rate | Best scenario |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
${engineRows.map(row => `| ${row.join(' | ')} |`).join('\n')}

## Highlights

- Engines tested: ${summary.totals.engines}
- Scenarios tested: ${summary.totals.scenarios}
- Total checks: ${summary.totals.checks}
- Total queries: ${summary.totals.totalQueries}
- Total measured duration: ${format(summary.totals.totalDurationMs)} ms
- Average latency across engines: ${format(summary.totals.avgLatencyMs)} ms
- Average TPS across engines: ${format(summary.totals.avgTps)}

## Ranking

- Fastest check by latency: ${summary.best.latency.name} / ${summary.best.latency.scenario} (${format(summary.best.latency.avgLatencyMs)} ms)
- Highest throughput: ${summary.best.tps.name} / ${summary.best.tps.scenario} (${format(summary.best.tps.tps)} TPS)
- Most stable check: ${summary.best.stability.name} / ${summary.best.stability.scenario} (${formatPercent(summary.best.stability.errorRate)} errors)
- Slowest check by latency: ${summary.worst.latency.name} / ${summary.worst.latency.scenario} (${format(summary.worst.latency.avgLatencyMs)} ms)
- Lowest throughput: ${summary.worst.tps.name} / ${summary.worst.tps.scenario} (${format(summary.worst.tps.tps)} TPS)

${summary.failures.length > 0 ? `## Failures\n\n${summary.failures.map(item => `- ${item}`).join('\n')}\n` : 'No threshold violations detected.\n'}
`
}

function renderCsv(summary) {
  const header = [
    'engine',
    'scenario',
    'status',
    'avg_latency_ms',
    'p95_latency_ms',
    'max_latency_ms',
    'tps',
    'error_rate',
    'queries',
    'branch',
    'commit',
    'simulator_version',
    'generated_at',
  ]
  const rows = summary.engines.map(engine => [
    engine.name,
    engine.scenario,
    engine.status,
    engine.avgLatencyMs,
    engine.p95LatencyMs,
    engine.maxLatencyMs,
    engine.tps,
    engine.errorRate,
    engine.totalQueries,
    summary.branch,
    shortCommit(summary.commit),
    summary.simulatorVersion,
    summary.generatedAt,
  ])

  return [header, ...rows]
    .map(row => row.map(csvEscape).join(','))
    .join('\n') + '\n'
}

function renderConsoleSummary(summary) {
  return [
    `Consolidated performance status: ${summary.passed ? 'PASS' : 'FAIL'}`,
    `Engines tested: ${summary.totals.engines}`,
    `Scenarios tested: ${summary.totals.scenarios}`,
    `Total checks: ${summary.totals.checks}`,
    `Total queries: ${summary.totals.totalQueries}`,
    `Version: ${summary.simulatorVersion}`,
    `Branch: ${summary.branch}`,
    `Commit: ${shortCommit(summary.commit)}`,
    `Average latency: ${format(summary.totals.avgLatencyMs)}ms`,
    `Average TPS: ${format(summary.totals.avgTps)}`,
    `Report: ${outputMd}`,
  ].join('\n')
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] ?? 0), 0)
}

function average(values) {
  return values.length === 0 ? 0 : sum(values.map(value => ({ value })), 'value') / values.length
}

function maxBy(items, key) {
  return [...items].sort((a, b) => Number(b[key]) - Number(a[key]))[0]
}

function minBy(items, key) {
  return [...items].sort((a, b) => Number(a[key]) - Number(b[key]))[0]
}

function mostStable(items) {
  return [...items].sort((a, b) => {
    const errorDiff = Number(a.errorRate) - Number(b.errorRate)
    if (errorDiff !== 0) return errorDiff
    return Number(b.tps) - Number(a.tps)
  })[0]
}

function buildConclusion({ passed, failures, best, worst, engineSummary }) {
  if (!passed) {
    return `La validacion de rendimiento detecto ${failures.length} incumplimiento(s). Revisar los motores y escenarios marcados como FAIL antes de integrar el cambio.`
  }

  const bestEngine = engineSummary[0]
  const slowestEngine = [...engineSummary].sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)[0]

  return [
    `Todas las combinaciones evaluadas cumplieron los umbrales configurados.`,
    `${best.tps.name} en escenario ${best.tps.scenario} obtuvo el mayor throughput con ${format(best.tps.tps)} TPS.`,
    `${best.latency.name} en escenario ${best.latency.scenario} registro la menor latencia promedio con ${format(best.latency.avgLatencyMs)} ms.`,
    `A nivel agregado, ${bestEngine.name} fue el motor con mejor TPS promedio (${format(bestEngine.avgTps)}), mientras que ${slowestEngine.name} presento la mayor latencia promedio (${format(slowestEngine.avgLatencyMs)} ms).`,
    `${worst.latency.name} en escenario ${worst.latency.scenario} fue la combinacion mas exigida por latencia, con ${format(worst.latency.avgLatencyMs)} ms.`,
  ].join(' ')
}

function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function format(value) {
  return Number(value).toFixed(2)
}

function formatPercent(value) {
  return `${(Number(value) * 100).toFixed(2)}%`
}

function shortCommit(commit) {
  return commit === 'local' ? commit : commit.slice(0, 7)
}
