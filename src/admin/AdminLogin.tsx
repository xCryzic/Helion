import { type FormEvent, useState } from 'react'
import completeLogo from '../../assets/Helion-Logo-Complete.png'
import { AdminApiError, loginAdmin } from '../services/adminApi'

type AdminLoginProps = { onAuthenticated: () => void }

export function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!password) {
      setStatus('error')
      setMessage('Enter the administrator password.')
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      await loginAdmin(password)
      setPassword('')
      onAuthenticated()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof AdminApiError ? error.message : 'Unable to sign in. Please try again.')
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-login__panel" aria-labelledby="admin-login-title">
        <a className="admin-brand" href="/" aria-label="Return to HELION website">
          <img src={completeLogo} alt="HELION" />
        </a>
        <div className="admin-login__index" aria-hidden="true">CONTROL / 27</div>
        <p className="admin-kicker">Restricted operations</p>
        <h1 id="admin-login-title">Admin access.</h1>
        <p className="admin-login__intro">Sign in to view and export participation-interest data.</p>
        <form onSubmit={submit} aria-busy={status === 'loading'} noValidate>
          <label htmlFor="admin-password">Administrator password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              if (status === 'error') setStatus('idle')
            }}
            aria-invalid={status === 'error'}
            aria-describedby={message ? 'admin-login-message' : undefined}
            autoFocus
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Authenticating…' : 'Enter dashboard'}
            <span aria-hidden="true">↗</span>
          </button>
          <p className={`admin-login__message ${status === 'error' ? 'is-error' : ''}`} id="admin-login-message" aria-live="polite">
            {message || (status === 'loading' ? 'Checking credentials…' : '')}
          </p>
        </form>
      </section>
      <aside className="admin-login__visual" aria-hidden="true">
        <span>01</span><span>DATA</span><span>HELION 2027</span>
      </aside>
    </main>
  )
}
