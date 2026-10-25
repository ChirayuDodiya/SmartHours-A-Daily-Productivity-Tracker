import { useState, useEffect } from 'react'
import {
  LogOut,
  Menu,
  Moon,
  Square,
  Sun,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react'
import Sidebar from './Sidebar'
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
import { formatDuration, navigateTo } from '@/utils/helpers'

export default function AppLayout({
  user,
  onLogout,
  activeSession,
  onStopActiveTimer,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(getInitialTheme)
  const [soundOn, setSoundOn] = useState(isSoundEnabled)
  const [nowTick, setNowTick] = useState(0)

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
    <div className="flex min-h-svh bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Global Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/80 bg-card/85 px-4 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/75 lg:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Active Session Pill in Header (Desktop & Tablet) */}
          {activeSession ? (
            <div className="hidden sm:flex items-center gap-3 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1.5 shadow-sm animate-pulse-glow">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
              </span>
              <button
                type="button"
                onClick={() => activeSession.date && navigateTo(`/day/${activeSession.date}`)}
                className="flex items-center gap-2 text-xs font-medium text-foreground hover:underline"
              >
                <span className="font-semibold text-primary max-w-[140px] truncate">
                  {activeSession.task_name || 'Active Task'}
                </span>
                <span className="font-mono-numbers font-semibold tabular-nums text-foreground">
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
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/40" />
              <span>Ready for deep work</span>
            </div>
          )}

          <div className="flex-1" />

          {/* Right Action Controls: Audio, Theme, User */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleSoundToggle}
              className="text-muted-foreground hover:text-foreground"
              title={soundOn ? 'Sound feedback active (click to mute)' : 'Sound muted (click to unmute)'}
              aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground/60" />}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              className="text-muted-foreground hover:text-foreground"
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
                  className="gap-2 max-w-[min(100%,220px)] border-border/80 font-medium"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
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
          </div>
        </header>

        {/* Mobile Active Session Banner */}
        {activeSession && (
          <div className="flex sm:hidden items-center justify-between border-b border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </span>
              <span className="font-semibold text-primary truncate max-w-[120px]">
                {activeSession.task_name || 'Active Task'}
              </span>
              <span className="font-mono-numbers tabular-nums font-semibold">
                {elapsedFormatted}
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

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 animate-in-fade">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
