import { useState, useEffect } from 'react'
import {
  BarChart3,
  CalendarDays,
  Clock,
  LogOut,
  Menu,
  Moon,
  Package,
  Square,
  Sun,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { applyTheme, getInitialTheme } from '@/utils/theme'
import { isSoundEnabled, toggleSound, playTimerStop } from '@/utils/soundEffects'
import { formatDuration, getRoutePath, navigateTo } from '@/utils/helpers'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Calendar & Focus',
    icon: CalendarDays,
    match: (p) => p === '/' || /^\/day\//.test(p),
  },
  {
    path: '/analytics',
    label: 'Insights & Trends',
    icon: BarChart3,
    match: (p) => p === '/analytics',
  },
  {
    path: '/packs',
    label: 'Task Templates',
    icon: Package,
    match: (p) => p === '/packs',
  },
]

export default function AppLayout({
  user,
  onLogout,
  activeSession,
  onStopActiveTimer,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState(getInitialTheme)
  const [soundOn, setSoundOn] = useState(isSoundEnabled)
  const [nowTick, setNowTick] = useState(0)
  const routePath = getRoutePath()

  // Keep live tick going every second if activeSession is running
  useEffect(() => {
    if (!activeSession) return undefined
    const interval = window.setInterval(() => {
      setNowTick(Date.now())
    }, 1000)
    return () => window.clearInterval(interval)
  }, [activeSession])

  function handleThemeToggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  function handleSoundToggle() {
    const next = toggleSound()
    setSoundOn(next)
  }

  // Calculate live elapsed seconds for active session
  let elapsedFormatted = '00:00:00'
  let livePoints = '0.0'
  if (activeSession && activeSession.start_time && nowTick > 0) {
    const startMs = Date.parse(activeSession.start_time)
    if (!Number.isNaN(startMs)) {
      const elapsedSec = Math.max(0, Math.floor((nowTick - startMs) / 1000))
      elapsedFormatted = formatDuration(elapsedSec)
      const weight = Number(activeSession.task_weight) || 1
      livePoints = ((elapsedSec / 3600) * weight * 5).toFixed(2)
    }
  }

  async function handleHeaderStop() {
    playTimerStop()
    if (onStopActiveTimer) {
      await onStopActiveTimer(activeSession.task_id)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-card/90 px-4 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/75 sm:px-6 lg:px-8">
        {/* Left: Brand & Top Nav Links */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-foreground">
                SmartHours
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Focus Studio
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Main navigation">
            {NAV_ITEMS.map(({ path, label, icon: Icon, match }) => {
              const isActive = match(routePath)
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigateTo(path)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-150',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Center: Active Session Pill */}
        {activeSession ? (
          <div className="hidden lg:flex items-center gap-3 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1.5 shadow-sm animate-pulse-glow">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            <button
              type="button"
              onClick={() => activeSession.date && navigateTo(`/day/${activeSession.date}`)}
              className="flex items-center gap-2 text-xs font-medium text-foreground hover:underline"
            >
              <span className="font-semibold text-primary max-w-[140px] truncate">
                {activeSession.task_name || 'Active Task'}
              </span>
              <span className="font-mono-numbers font-bold tabular-nums text-foreground">
                {elapsedFormatted}
              </span>
              <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary font-mono-numbers">
                +{livePoints} pts
              </span>
            </button>
            {onStopActiveTimer && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleHeaderStop}
                title="Stop session"
              >
                <Square className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : null}

        {/* Right Controls: Audio, Theme, User Profile & Mobile Toggle */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSoundToggle}
            className="text-muted-foreground hover:text-foreground h-9 w-9"
            title={soundOn ? 'Sound cues active (click to mute)' : 'Sound muted (click to unmute)'}
            aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground/60" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="text-muted-foreground hover:text-foreground h-9 w-9"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 max-w-[min(100%,200px)] border-border/80 font-medium h-9"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <User className="h-3 w-3" aria-hidden="true" />
                </div>
                <span className="truncate text-xs font-semibold">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuLabel className="font-normal p-2">
                <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
                <p className="truncate text-sm font-semibold text-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-md"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Hamburger */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Drawer / Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/80 bg-card p-3 animate-in-fade space-y-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon, match }) => {
            const isActive = match(routePath)
            return (
              <button
                key={path}
                type="button"
                onClick={() => {
                  navigateTo(path)
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Mobile Active Session Banner */}
      {activeSession && (
        <div className="flex lg:hidden items-center justify-between border-b border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            <button
              type="button"
              onClick={() => activeSession.date && navigateTo(`/day/${activeSession.date}`)}
              className="font-semibold text-primary truncate max-w-[140px] hover:underline"
            >
              {activeSession.task_name || 'Active Task'}
            </button>
            <span className="font-mono-numbers tabular-nums font-bold">
              {elapsedFormatted}
            </span>
            <span className="rounded bg-primary/20 px-1 py-0.5 text-[9px] font-bold text-primary font-mono-numbers">
              +{livePoints}
            </span>
          </div>
          {onStopActiveTimer && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-7 px-2.5 text-xs font-semibold gap-1"
              onClick={handleHeaderStop}
            >
              <Square className="h-3 w-3" />
              Stop
            </Button>
          )}
        </div>
      )}

      {/* Main Full-Width Content Container */}
      <main className="flex-1 overflow-auto">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
