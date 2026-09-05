import { spawn, spawnSync } from 'node:child_process'

const initialCompile = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.server.json'], { stdio: 'inherit' })
if (initialCompile.status !== 0) process.exit(initialCompile.status ?? 1)

const children = [
  spawn(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.server.json', '--watch', '--preserveWatchOutput'], { stdio: 'inherit' }),
  spawn(process.execPath, ['--env-file-if-exists=.env', '--watch', 'server-dist/server/index.js'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--configLoader', 'runner'], { stdio: 'inherit' }),
]

let stopping = false
function stop(exitCode = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exitCode = exitCode
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (!stopping && code !== 0 && signal == null) stop(code ?? 1)
  })
}

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
