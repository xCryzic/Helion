import { useCallback, useEffect, useState } from 'react'
import { getAdminSession } from '../services/adminApi'
import { AdminDashboard } from './AdminDashboard'
import { AdminLogin } from './AdminLogin'

export function AdminApp() {
  const [session, setSession] = useState<'checking' | 'authenticated' | 'guest'>('checking')
  const showGuest = useCallback(() => setSession('guest'), [])

  useEffect(() => {
    document.title = 'HELION Admin — Participation Control'
    void getAdminSession().then((authenticated) => setSession(authenticated ? 'authenticated' : 'guest')).catch(showGuest)
  }, [showGuest])

  if (session === 'checking') {
    return <main className="admin-checking" aria-live="polite"><span>HELION / ADMIN</span><p>Checking session…</p></main>
  }
  if (session === 'guest') return <AdminLogin onAuthenticated={() => setSession('authenticated')} />
  return <AdminDashboard onLoggedOut={showGuest} />
}
