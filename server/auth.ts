import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'helion_admin_session'

export function verifyPassword(password: string, configuredHash: string | undefined): boolean {
  if (!configuredHash) return false
  const [algorithm, saltHex, expectedHex] = configuredHash.split('$')
  if (algorithm !== 'scrypt' || !saltHex || !expectedHex) return false

  try {
    const expected = Buffer.from(expectedHex, 'hex')
    const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
    return expected.length > 0 && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function createSessionToken(secret: string): { cookieValue: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url')
  const signature = createHmac('sha256', secret).update(token).digest('base64url')
  return { cookieValue: `${token}.${signature}`, tokenHash: hashToken(token) }
}

export function verifySessionCookie(cookieValue: string | undefined, secret: string): string | null {
  if (!cookieValue) return null
  const [token, providedSignature] = cookieValue.split('.')
  if (!token || !providedSignature) return null
  const expectedSignature = createHmac('sha256', secret).update(token).digest()
  const provided = Buffer.from(providedSignature, 'base64url')
  if (provided.length !== expectedSignature.length || !timingSafeEqual(provided, expectedSignature)) return null
  return hashToken(token)
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {}
  return Object.fromEntries(cookieHeader.split(';').map((part) => {
    const separator = part.indexOf('=')
    if (separator < 0) return [part.trim(), '']
    return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]
  }))
}

export function sessionCookie(value: string, maxAgeSeconds: number, secure: boolean): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`
}

export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`
}
