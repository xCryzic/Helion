type RateEntry = { count: number; resetAt: number }

export class MemoryRateLimiter {
  private readonly entries = new Map<string, RateEntry>()

  constructor(
    private readonly maximumAttempts: number,
    private readonly windowMilliseconds: number,
  ) {}

  check(key: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now()
    const existing = this.entries.get(key)
    if (!existing || existing.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMilliseconds })
      this.compact(now)
      return { allowed: true, retryAfterSeconds: 0 }
    }

    existing.count += 1
    return {
      allowed: existing.count <= this.maximumAttempts,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  reset(key: string) {
    this.entries.delete(key)
  }

  private compact(now: number) {
    if (this.entries.size < 1_000) return
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key)
    }
  }
}
