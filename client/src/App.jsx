import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import AuthPage from './components/AuthPage'
import LoadingScreen from './components/shared/LoadingScreen'
import { getRoutePath, navigateTo } from './utils/helpers'
import { API_URL } from './utils/constants'

const DailyPageShell = lazy(() => import('./components/DailyPageShell'))
const CalendarDashboard = lazy(() => import('./components/CalendarDashboard'))
const TaskPacksPage = lazy(() => import('./components/TaskPacksPage'))
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'))

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

  // Check active session whenever user is authenticated
  useEffect(() => {
    if (!authState.user) {
      return
    }

    fetch(`${API_URL}/api/v1/sessions/active`, {
      credentials: 'include',
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
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
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
    setActiveSession(null)
    localStorage.removeItem('smarthours_token')
    setEmail('')
    setPassword('')
    setStatus({ type: '', message: '' })
  }

  async function handleStopActiveTimer(taskId) {
    try {
      await fetch(`${API_URL}/api/v1/tasks/${taskId}/stop`, {
        method: 'POST',
        credentials: 'include',
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

    return (
      <Suspense fallback={<LoadingScreen />}>
        {dayMatch ? (
          <DailyPageShell
            date={dayMatch[1]}
            user={authState.user}
            onBack={() => navigateTo('/')}
            onLogout={handleLogout}
            activeSession={activeSession}
            onStopActiveTimer={handleStopActiveTimer}
          />
        ) : routePath === '/packs' ? (
          <TaskPacksPage
            user={authState.user}
            onLogout={handleLogout}
            activeSession={activeSession}
            onStopActiveTimer={handleStopActiveTimer}
          />
        ) : routePath === '/analytics' ? (
          <AnalyticsDashboard
            user={authState.user}
            onLogout={handleLogout}
            activeSession={activeSession}
            onStopActiveTimer={handleStopActiveTimer}
          />
        ) : (
          <CalendarDashboard
            user={authState.user}
            onLogout={handleLogout}
            activeSession={activeSession}
            onStopActiveTimer={handleStopActiveTimer}
          />
        )}
      </Suspense>
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
