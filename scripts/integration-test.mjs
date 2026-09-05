import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { scryptSync } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const root = resolve(import.meta.dirname, '..')
const temporaryRoot = await mkdtemp(join(tmpdir(), 'helion-integration-'))
const databasePath = join(temporaryRoot, 'helion.sqlite')
const password = 'HelionTest!2027'
const salt = Buffer.alloc(16, 7)
const passwordHash = ['scrypt', salt.toString('hex'), scryptSync(password, salt, 64).toString('hex')].join('$')
const port = await availablePort()
const baseUrl = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, ['server-dist/server/index.js'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    HOST: '127.0.0.1',
    DATABASE_PATH: databasePath,
    ADMIN_PASSWORD_HASH: passwordHash,
    SECRET_KEY: 'integration-test-secret-with-sufficient-length',
  },
})

try {
  await waitForServer()
  let response = await fetch(`${baseUrl}/admin`)
  assert.equal(response.status, 200, 'Production server should serve /admin')

  response = await fetch(`${baseUrl}/api/admin/participants`)
  assert.equal(response.status, 401, 'Participant data must reject unauthenticated reads')

  response = await post('/api/admin/login', { password: 'incorrect-password' })
  assert.equal(response.status, 401, 'Incorrect password must be rejected')

  response = await post('/api/admin/login', { password })
  assert.equal(response.status, 200, 'Correct password must authenticate')
  const setCookie = response.headers.get('set-cookie') || ''
  assert.match(setCookie, /HttpOnly/i)
  assert.match(setCookie, /SameSite=Strict/i)
  assert.match(setCookie, /Secure/i)
  const cookie = setCookie.split(';')[0]

  response = await fetch(`${baseUrl}/api/admin/session`, { headers: { Cookie: cookie } })
  assert.deepEqual(await response.json(), { authenticated: true })

  response = await fetch(`${baseUrl}/api/admin/participants`, { headers: { Cookie: cookie } })
  let listing = await response.json()
  assert.equal(listing.overallTotal, 0, 'Database should begin empty')

  response = await post('/api/interest', { studentName: '', email: 'bad', school: '', grade: '', eventIds: [] })
  assert.equal(response.status, 422, 'Invalid public form data must fail backend validation')
  assert.doesNotMatch(await response.text(), /stack|sqlite|server\/index/i)

  response = await post('/api/interest', { studentName: 'Student', email: 'student@example.com', school: 'School', grade: '10', eventIds: ['not-an-event'] })
  assert.equal(response.status, 422, 'Unknown competition identifiers must be rejected')

  const submission = { studentName: '  Zara Test  ', email: ' ZARA@EXAMPLE.COM ', school: '  Example School  ', grade: ' 10 ', eventIds: ['hackathon', 'ctf'] }
  response = await post('/api/interest', submission)
  assert.equal(response.status, 201, 'Valid multi-event submission should be created')
  const created = await response.json()
  assert.equal(typeof created.id, 'number')

  const database = new DatabaseSync(databasePath)
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM participants').get().count, 1)
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM participant_events').get().count, 2)
  database.close()

  response = await post('/api/interest', submission)
  assert.equal(response.status, 409, 'Recent identical submissions should be rejected')

  response = await fetch(`${baseUrl}/api/admin/participants?event=ctf&search=Zara&school=Example%20School&grade=10&sort=oldest`, { headers: { Cookie: cookie } })
  assert.equal(response.status, 200)
  listing = await response.json()
  assert.equal(listing.total, 1)
  assert.equal(listing.participants[0].studentName, 'Zara Test')
  assert.equal(listing.participants[0].email, 'zara@example.com')
  assert.deepEqual(new Set(listing.participants[0].eventIds), new Set(['hackathon', 'ctf']))

  response = await fetch(`${baseUrl}/api/admin/export?event=ctf&sort=oldest`, { headers: { Cookie: cookie } })
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-disposition') || '', /attachment/)
  const csv = await response.text()
  assert.match(csv, /ID,Timestamp,Student Name,Email,School,Class \/ Grade,Interested Events/)
  assert.match(csv, /Zara Test/)
  assert.match(csv, /Hackathon; CTF|CTF; Hackathon/)

  response = await fetch(`${baseUrl}/api/admin/export`)
  assert.equal(response.status, 401, 'CSV export must reject unauthenticated access')

  response = await fetch(`${baseUrl}/api/admin/logout`, { method: 'POST', headers: { Cookie: cookie } })
  assert.equal(response.status, 204)
  response = await fetch(`${baseUrl}/api/admin/participants`, { headers: { Cookie: cookie } })
  assert.equal(response.status, 401, 'Logged-out sessions must lose participant access')

  response = await post('/api/interest', submission, { Origin: 'https://attacker.example' })
  assert.equal(response.status, 403, 'Cross-origin state-changing requests must be rejected')

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    response = await post('/api/admin/login', { password: 'incorrect-password' })
    assert.equal(response.status, attempt <= 5 ? 401 : 429, 'Login rate limit should block the sixth failed attempt')
  }

  console.log('Integration checks passed: SQLite, validation, duplicates, auth, sessions, filters, CSV, logout, origin and rate limiting.')
} finally {
  server.kill()
  await new Promise((resolveExit) => server.once('exit', resolveExit))
  await rm(temporaryRoot, { recursive: true, force: true })
}

async function post(path, body, extraHeaders = {}) {
  return await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  })
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/admin/session`)
      if (response.ok) return
    } catch {
      // Server is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  }
  throw new Error('Integration server did not start.')
}

async function availablePort() {
  const probe = createServer()
  await new Promise((resolveListen) => probe.listen(0, '127.0.0.1', resolveListen))
  const address = probe.address()
  const selectedPort = typeof address === 'object' && address ? address.port : 0
  await new Promise((resolveClose) => probe.close(resolveClose))
  return selectedPort
}
