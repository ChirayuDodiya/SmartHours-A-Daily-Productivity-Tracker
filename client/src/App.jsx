import { useEffect, useMemo, useState } from 'react'
import heroImg from './assets/hero.png'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function App() {
  const [authState, setAuthState] = useState({
    isChecking: true,
    user: null,
  })
  const [mode, setMode] = useState(() => {
    return window.location.pathname.toLowerCase().includes('register')
      ? 'register'
      : 'login'
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRegister = mode === 'register'
  const copy = useMemo(() => {
    return isRegister
      ? {
          title: 'Create your SmartHours account',
          eyebrow: 'Start tracking',
          submit: 'Create account',
          switchPrompt: 'Already have an account?',
          switchAction: 'Sign in',
        }
      : {
          title: 'Welcome back to SmartHours',
          eyebrow: 'Sign in',
          submit: 'Sign in',
          switchPrompt: 'New to SmartHours?',
          switchAction: 'Create account',
        }
  }, [isRegister])

  useEffect(() => {
    let isMounted = true
    localStorage.removeItem('smarthours_token')

    fetch(`${API_URL}/auth/me`, {
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) {
          return null
        }

        const data = await response.json()
        return data.user
      })
      .then((user) => {
        if (isMounted) {
          setAuthState({ isChecking: false, user })
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthState({ isChecking: false, user: null })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed')
      }

      setStatus({
        type: 'success',
        message: isRegister
          ? 'Account created. You are signed in.'
          : 'Signed in successfully.',
      })
      setAuthState({ isChecking: false, user: data.user })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleGoogleAuth() {
    window.location.href = `${API_URL}/auth/google`
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setStatus({ type: '', message: '' })
  }

  async function handleLogout() {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })

    setAuthState({ isChecking: false, user: null })
    localStorage.removeItem('smarthours_token')
    setEmail('')
    setPassword('')
    setStatus({ type: '', message: '' })
  }

  if (authState.isChecking) {
    return (
      <main className="loading-shell">
        <div className="loading-mark">SmartHours</div>
      </main>
    )
  }

  if (authState.user) {
    return (
      <main className="protected-shell">
        <nav className="app-nav">
          <strong>SmartHours</strong>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </nav>
        <section className="dashboard-preview">
          <p className="eyebrow">Protected route</p>
          <h1>Ready to track your day</h1>
          <p>Signed in as {authState.user.email}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <section className="auth-visual" aria-label="SmartHours overview">
        <div className="brand-mark">SmartHours</div>
        <img src={heroImg} alt="" className="hero-art" />
        <div className="score-strip" aria-hidden="true">
          <span>Today</span>
          <strong>42 pts</strong>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="auth-title">{copy.title}</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              minLength={isRegister ? 8 : undefined}
              required
            />
          </label>

          {status.message && (
            <p className={`form-status ${status.type}`} role="status">
              {status.message}
            </p>
          )}

          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : copy.submit}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button className="google-action" type="button" onClick={handleGoogleAuth}>
          <span aria-hidden="true">G</span>
          Continue with Google
        </button>

        <p className="mode-switch">
          {copy.switchPrompt}{' '}
          <button type="button" onClick={switchMode}>
            {copy.switchAction}
          </button>
        </p>
      </section>
    </main>
  )
}

export default App
