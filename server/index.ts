import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { eventIds } from '../shared/events.js'
import { clearSessionCookie, createSessionToken, parseCookies, SESSION_COOKIE, sessionCookie, verifyPassword, verifySessionCookie } from './auth.js'
import { participantsToCsv } from './csv.js'
import { HelionDatabase } from './database.js'
import { MemoryRateLimiter } from './rateLimit.js'
import type { ParticipantFilters } from './types.js'
import { validateInterestInput } from './validation.js'

const projectRoot = process.cwd()
const port = readPositiveInteger(process.env.PORT, 8787)
const host = process.env.HOST || '127.0.0.1'
const databasePath = resolve(projectRoot, process.env.DATABASE_PATH || './data/helion.sqlite')
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH
const secretKey = process.env.SECRET_KEY || ''
const sessionHours = readPositiveInteger(process.env.SESSION_HOURS, 8)
const isProduction = process.env.NODE_ENV === 'production'
const trustProxy = process.env.TRUST_PROXY === 'true'
const database = new HelionDatabase(databasePath)
const loginLimiter = new MemoryRateLimiter(5, 15 * 60 * 1000)
const interestLimiter = new MemoryRateLimiter(20, 60 * 60 * 1000)
const maximumBodyBytes = 32 * 1024

const server = createServer(async (request, response) => {
  applySecurityHeaders(response)
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url)
      return
    }
    await serveFrontend(request, response, url.pathname)
  } catch (error) {
    if (error instanceof ResponseSentError) return
    if (error instanceof HttpError) {
      sendJson(response, error.status, { error: error.message })
      return
    }
    console.error('Unexpected server error.')
    sendJson(response, 500, { error: 'An unexpected server error occurred.' })
  }
})

async function handleApi(request: IncomingMessage, response: ServerResponse, url: URL) {
  const method = request.method || 'GET'

  if (url.pathname === '/api/interest') {
    if (method !== 'POST') return methodNotAllowed(response, ['POST'])
    requireTrustedOrigin(request)
    const rate = interestLimiter.check(clientIp(request))
    if (!rate.allowed) return tooManyRequests(response, rate.retryAfterSeconds)
    const validation = validateInterestInput(await readJson(request))
    if (!validation.ok) {
      sendJson(response, 422, { error: 'Please correct the submitted fields.', fields: validation.errors })
      return
    }
    const result = database.createParticipant(validation.value)
    if (!result.created) {
      sendJson(response, 409, { error: 'This interest submission was already received recently.', code: 'DUPLICATE_SUBMISSION' })
      return
    }
    sendJson(response, 201, { id: result.participant.id, submittedAt: result.participant.submittedAt })
    return
  }

  if (url.pathname === '/api/admin/login') {
    if (method !== 'POST') return methodNotAllowed(response, ['POST'])
    requireTrustedOrigin(request)
    if (!adminPasswordHash || !secretKey) {
      sendJson(response, 503, { error: 'Admin authentication is not configured.' })
      return
    }
    const ip = clientIp(request)
    const rate = loginLimiter.check(ip)
    if (!rate.allowed) return tooManyRequests(response, rate.retryAfterSeconds)
    const body = await readJson(request)
    const password = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>).password : undefined
    if (typeof password !== 'string' || password.length > 512 || !verifyPassword(password, adminPasswordHash)) {
      sendJson(response, 401, { error: 'Invalid administrator password.' })
      return
    }
    loginLimiter.reset(ip)
    const maxAgeSeconds = sessionHours * 60 * 60
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000).toISOString()
    const session = createSessionToken(secretKey)
    database.createSession(session.tokenHash, expiresAt)
    response.setHeader('Set-Cookie', sessionCookie(session.cookieValue, maxAgeSeconds, isProduction))
    sendJson(response, 200, { authenticated: true, expiresAt })
    return
  }

  if (url.pathname === '/api/admin/session') {
    if (method !== 'GET') return methodNotAllowed(response, ['GET'])
    const tokenHash = authenticatedTokenHash(request)
    sendJson(response, 200, { authenticated: Boolean(tokenHash) })
    return
  }

  if (url.pathname === '/api/admin/logout') {
    if (method !== 'POST') return methodNotAllowed(response, ['POST'])
    requireTrustedOrigin(request)
    const tokenHash = authenticatedTokenHash(request)
    if (tokenHash) database.deleteSession(tokenHash)
    response.setHeader('Set-Cookie', clearSessionCookie(isProduction))
    response.statusCode = 204
    response.end()
    return
  }

  if (url.pathname === '/api/admin/participants') {
    if (method !== 'GET') return methodNotAllowed(response, ['GET'])
    requireAdmin(request, response)
    const filters = parseFilters(url)
    sendJson(response, 200, database.listParticipants(filters))
    return
  }

  if (url.pathname === '/api/admin/export') {
    if (method !== 'GET') return methodNotAllowed(response, ['GET'])
    requireAdmin(request, response)
    const filters = parseFilters(url)
    const csv = participantsToCsv(database.allParticipants(filters))
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/csv; charset=utf-8')
    response.setHeader('Content-Disposition', 'attachment; filename="helion-interest-registrations.csv"')
    response.setHeader('Cache-Control', 'no-store')
    response.end(csv)
    return
  }

  sendJson(response, 404, { error: 'API route not found.' })
}

function parseFilters(url: URL): ParticipantFilters {
  const eventId = cleanQuery(url.searchParams.get('event'), 80)
  if (eventId && !eventIds.has(eventId)) throw new HttpError(400, 'Invalid event filter.')
  const sort = url.searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest'
  return {
    search: cleanQuery(url.searchParams.get('search'), 160),
    eventId,
    school: cleanQuery(url.searchParams.get('school'), 160),
    grade: cleanQuery(url.searchParams.get('grade'), 40),
    sort,
  }
}

function cleanQuery(value: string | null, maximum: number): string | undefined {
  const cleaned = value?.trim()
  if (!cleaned) return undefined
  if (cleaned.length > maximum) throw new HttpError(400, 'A filter value is too long.')
  return cleaned
}

function authenticatedTokenHash(request: IncomingMessage): string | null {
  if (!secretKey) return null
  const cookies = parseCookies(request.headers.cookie)
  const tokenHash = verifySessionCookie(cookies[SESSION_COOKIE], secretKey)
  return tokenHash && database.sessionIsValid(tokenHash) ? tokenHash : null
}

function requireAdmin(request: IncomingMessage, response: ServerResponse): string {
  const tokenHash = authenticatedTokenHash(request)
  if (!tokenHash) {
    sendJson(response, 401, { error: 'Administrator authentication is required.' })
    throw new ResponseSentError()
  }
  return tokenHash
}

function requireTrustedOrigin(request: IncomingMessage) {
  const origin = request.headers.origin
  if (!origin) return
  try {
    if (new URL(origin).host !== request.headers.host) throw new HttpError(403, 'Request origin was rejected.')
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(403, 'Request origin was rejected.')
  }
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'Content-Type must be application/json.')
  }
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > maximumBodyBytes) throw new HttpError(413, 'Request body is too large.')
    chunks.push(buffer)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new HttpError(400, 'Request body must contain valid JSON.')
  }
}

async function serveFrontend(request: IncomingMessage, response: ServerResponse, pathname: string) {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) return methodNotAllowed(response, ['GET', 'HEAD'])
  const distributionPath = resolve(projectRoot, 'dist')
  if (!existsSync(distributionPath)) {
    sendJson(response, 404, { error: 'Frontend build not found. Run the Vite development server or build the project.' })
    return
  }
  let requestedPath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname)
  let filePath = resolve(join(distributionPath, requestedPath.replace(/^[/\\]+/, '')))
  if (!filePath.startsWith(`${distributionPath}${sep}`) && filePath !== distributionPath) throw new HttpError(403, 'Invalid path.')
  if (!existsSync(filePath) || extname(filePath) === '') filePath = join(distributionPath, 'index.html')
  const content = await readFile(filePath)
  response.statusCode = 200
  response.setHeader('Content-Type', contentType(filePath))
  response.setHeader('Cache-Control', filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable')
  if (request.method === 'HEAD') response.end()
  else response.end(content)
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  if (response.writableEnded) return
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

function methodNotAllowed(response: ServerResponse, methods: string[]) {
  response.setHeader('Allow', methods.join(', '))
  sendJson(response, 405, { error: 'Method not allowed.' })
}

function tooManyRequests(response: ServerResponse, retryAfterSeconds: number) {
  response.setHeader('Retry-After', String(retryAfterSeconds))
  sendJson(response, 429, { error: 'Too many requests. Please try again later.' })
}

function applySecurityHeaders(response: ServerResponse) {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
}

function clientIp(request: IncomingMessage): string {
  if (trustProxy) {
    const forwarded = request.headers['x-forwarded-for']
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]
    if (first?.trim()) return first.trim()
  }
  return request.socket.remoteAddress || 'unknown'
}

function contentType(filePath: string): string {
  const extension = extname(filePath).toLowerCase()
  return ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.map': 'application/json; charset=utf-8' } as Record<string, string>)[extension] || 'application/octet-stream'
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

class ResponseSentError extends Error {}

server.on('clientError', (_error, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'))
server.listen(port, host, () => {
  console.log(`HELION server listening on http://${host}:${port}`)
})

function shutdown() {
  server.close(() => {
    database.close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
