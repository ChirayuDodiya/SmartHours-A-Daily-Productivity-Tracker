import { useEffect, useMemo, useState } from 'react'
import AuthPage from './components/AuthPage'
import LoadingScreen from './components/shared/LoadingScreen'
import DailyPageShell from './components/DailyPageShell'
import CalendarDashboard from './components/CalendarDashboard'
import TaskPacksPage from './components/TaskPacksPage'
import InsightsDashboard from './components/InsightsDashboard'
import { getRoutePath, navigateTo } from './utils/helpers'
import { API_URL } from './utils/constants'
import { getStoredToken, setStoredToken, removeStoredToken } from './utils/storage'

function App() {
  const [authState, setAuthState] = useState({
    isChecking: true,
    user: null,
  })
  const [routePath, setRoutePath] = useState(getRoutePath)
  const [activeSession, setActiveSession] = useState(null)
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
    function handleRouteChange() {
      setRoutePath(getRoutePath())
    }

    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // Check if token was provided in URL (e.g. redirected from Google OAuth)
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const urlToken = urlParams.get('token')
        if (urlToken) {
          setStoredToken(urlToken)
          urlParams.delete('token')
          const cleanQuery = urlParams.toString() ? `?${urlParams.toString()}` : ''
          window.history.replaceState({}, '', `${window.location.pathname}${cleanQuery}`)
        }
      } catch {
        // Safe fallback
      }
    }

    const token = getStoredToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    fetch(`${API_URL}/auth/me`, {
      credentials: 'include',
      headers,
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

  // Check active session whenever user is authenticated
  useEffect(() => {
    if (!authState.user) {
      return
    }

    const token = getStoredToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    fetch(`${API_URL}/api/v1/sessions/active`, {
      credentials: 'include',
      headers,
    })
      .then(async (res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        if (data?.active_session) {
          setActiveSession(data.active_session)
        }
      })
      .catch(() => {})
  }, [authState.user])

  useEffect(() => {
    if (!authState.user) {
      return undefined
    }

    const intervalId = window.setInterval(async () => {
      try {
        const token = getStoredToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
          headers,
        })

        if (!response.ok) {
          if (response.status === 401) {
            await handleLogout()
          }
          return
        }

        const data = await response.json()
        if (!data?.user) {
          await handleLogout()
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [authState.user])

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

      if (data.token) {
        setStoredToken(data.token)
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
    const token = getStoredToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      })
    } catch {
      // Ignore network errors on logout
    }

    removeStoredToken()
    setAuthState({ isChecking: false, user: null })
    setActiveSession(null)
    setEmail('')
    setPassword('')
    setStatus({ type: '', message: '' })
  }

  async function handleStopActiveTimer(taskId) {
    try {
      const token = getStoredToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      await fetch(`${API_URL}/api/v1/tasks/${taskId}/stop`, {
        method: 'POST',
        credentials: 'include',
        headers,
      })
      setActiveSession(null)
    } catch (err) {
      console.error('Stop active timer failed:', err)
    }
  }

  if (authState.isChecking) {
    return <LoadingScreen />
  }

  if (authState.user) {
    const dayMatch = routePath.match(/^\/day\/(\d{4}-\d{2}-\d{2})$/)

    if (dayMatch) {
      return (
        <DailyPageShell
          date={dayMatch[1]}
          user={authState.user}
          onBack={() => navigateTo('/')}
          onLogout={handleLogout}
          activeSession={activeSession}
          onStopActiveTimer={handleStopActiveTimer}
        />
      )
    }

    if (routePath === '/packs') {
      return (
        <TaskPacksPage
          user={authState.user}
          onLogout={handleLogout}
          activeSession={activeSession}
          onStopActiveTimer={handleStopActiveTimer}
        />
      )
    }

    if (routePath === '/analytics') {
      return (
        <InsightsDashboard
          user={authState.user}
          onLogout={handleLogout}
          activeSession={activeSession}
          onStopActiveTimer={handleStopActiveTimer}
        />
      )
    }

    return (
      <CalendarDashboard
        user={authState.user}
        onLogout={handleLogout}
        activeSession={activeSession}
        onStopActiveTimer={handleStopActiveTimer}
      />
    )
  }

  return (
    <AuthPage
      copy={copy}
      email={email}
      password={password}
      status={status}
      isSubmitting={isSubmitting}
      onEmailChange={(event) => setEmail(event.target.value)}
      onPasswordChange={(event) => setPassword(event.target.value)}
      onSubmit={handleSubmit}
      onGoogleAuth={handleGoogleAuth}
      onSwitchMode={switchMode}
    />
  )
}

export default App
