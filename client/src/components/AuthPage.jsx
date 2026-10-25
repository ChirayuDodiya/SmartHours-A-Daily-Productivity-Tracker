import {
  CalendarDays,
  Clock,
  Flame,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AuthPage({
  copy,
  email,
  password,
  status,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleAuth,
  onSwitchMode,
}) {
  return (
    <main className="grid min-h-svh lg:grid-cols-12 bg-background">
      {/* Left Showcase Hero Panel (7 cols on large screens) */}
      <section
        className="relative hidden lg:flex lg:col-span-7 flex-col justify-between overflow-hidden border-r border-border/80 bg-gradient-to-br from-card via-background to-secondary/30 p-10 xl:p-14"
        aria-label="SmartHours overview"
      >
        {/* Ambient radial glows */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              SmartHours
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              Precision Focus & Productivity Studio
            </span>
          </div>
        </div>

        {/* Center: Live Product Simulation / Interactive Cards */}
        <div className="relative z-10 my-8 space-y-6 max-w-lg">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Designed for builders & deep thinkers</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Turn your daily focus hours into measurable momentum.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Traditional time tracking feels like administrative paperwork. SmartHours multiplies high-leverage focus sessions into daily scores, visual heatmap calendars, and unbreakable streaks.
            </p>
          </div>

          {/* Simulated Focus Card */}
          <div className="rounded-2xl border border-sky-500/40 bg-card/90 p-5 shadow-2xl backdrop-blur-md ring-1 ring-sky-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Active Focus Session
                </span>
              </div>
              <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-500">
                2.0x Deep Work Multiplier
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-base font-bold text-foreground">Core Architecture & Shading</p>
                <p className="text-xs text-muted-foreground mt-0.5">Focus Studio Sprint</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-foreground font-mono-numbers">
                  01:42:35
                </p>
                <p className="text-xs font-bold text-emerald-500 font-mono-numbers">
                  +17.1 pts earned
                </p>
              </div>
            </div>

            {/* Simulated progress towards 40 pts */}
            <div className="space-y-1.5 border-t border-border/60 pt-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Daily Goal Target (40.0 pts)</span>
                <span className="text-emerald-500 font-mono-numbers">42.5 pts (106% Reached!)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full w-full bg-emerald-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/60 p-3 text-xs font-semibold text-foreground">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Multiplier Scoring</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/60 p-3 text-xs font-semibold text-foreground">
              <CalendarDays className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Visual Heatmap Calendar</span>
            </div>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="relative z-10 text-xs text-muted-foreground flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} SmartHours</span>
          <span className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            Keep your streak alive
          </span>
        </div>
      </section>

      {/* Right Auth Form Panel (5 cols on large screens) */}
      <section
        className="flex lg:col-span-5 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16"
        aria-labelledby="auth-title"
      >
        <div className="mx-auto w-full max-w-sm space-y-6 animate-in-slide">
          {/* Mobile brand header */}
          <div className="flex items-center gap-2 lg:hidden mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-foreground">SmartHours</span>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-primary/90 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {copy.eyebrow}
            </p>
            <h1 id="auth-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {copy.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Enter your credentials to access your productivity studio.
            </p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={onEmailChange}
                  placeholder="name@example.com"
                  required
                  className="h-11 rounded-xl pl-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
                {copy.submit === 'Create account' && (
                  <span className="text-[11px] text-muted-foreground">Min 8 chars</span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete={copy.submit === 'Create account' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={onPasswordChange}
                  placeholder="••••••••"
                  minLength={copy.submit === 'Create account' ? 8 : undefined}
                  required
                  className="h-11 rounded-xl pl-10 text-sm"
                />
              </div>
            </div>

            {status.message && (
              <Alert variant={status.type === 'error' ? 'destructive' : 'success'}>
                <AlertDescription role="status">{status.message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl font-bold text-sm shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Authenticating…
                </>
              ) : (
                copy.submit
              )}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-semibold">
                or
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl font-semibold text-sm border-border/80 shadow-sm hover:bg-secondary gap-2"
            onClick={onGoogleAuth}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {copy.switchPrompt}{' '}
            <button
              type="button"
              onClick={onSwitchMode}
              className="font-bold text-primary hover:underline ml-1"
            >
              {copy.switchAction}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
