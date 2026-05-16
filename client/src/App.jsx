import { useEffect, useMemo, useState } from 'react'
import AuthPage from './components/AuthPage'
import LoadingScreen from './components/shared/LoadingScreen'
import DailyPageShell from './components/DailyPageShell'
import CalendarDashboard from './components/CalendarDashboard'
import TaskPacksPage from './components/TaskPacksPage'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import { getRoutePath, navigateTo } from './utils/helpers'
import { API_URL } from './utils/constants'

function App() {
  const [authState, setAuthState] = useState({
    isChecking: true,
    user: null,
  })
  const [routePath, setRoutePath] = useState(getRoutePath)
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

  useEffect(() => {
    if (!authState.user) {
      return undefined
    }

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include'
        })

        if (!response.ok) {
          await handleLogout()
          return
        }

        const data = await response.json()
        if (!data?.user) {
          await handleLogout()
        }
      } catch (error) {
        await handleLogout()
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
    localStorage.removeItem('smarthours_token')
    setEmail('')
    setPassword('')
    setStatus({ type: '', message: '' })
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
        />
      )
    }

    if (routePath === '/packs') {
      return <TaskPacksPage user={authState.user} onLogout={handleLogout} />
    }

    if (routePath === '/analytics') {
      return <AnalyticsDashboard user={authState.user} onLogout={handleLogout} />
    }

    return <CalendarDashboard user={authState.user} onLogout={handleLogout} />
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
