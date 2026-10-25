import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react'
import {
  getDateKey,
  getCalendarDays,
  getScoreLevel,
  isFutureDate,
  navigateTo,
  apiRequest,
} from '../utils/helpers'
import { WEEKDAYS, MONTH_FORMATTER, DAY_FORMATTER } from '../utils/constants'
import ProtectedShell from './ProtectedShell'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const SCORE_TIERS = [
  { level: 'purple', label: '50+ Legendary', bg: 'bg-violet-500/15 text-violet-500 border-violet-500/30' },
  { level: 'green', label: '40–49 Flow', bg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  { level: 'yellow', label: '30–39 Momentum', bg: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  { level: 'red', label: '<30 Warmup', bg: 'bg-rose-500/15 text-rose-500 border-rose-500/30' },
]

const CELL_TIER_STYLES = {
  purple: 'border-violet-500/40 bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent hover:border-violet-500/70',
  green: 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent hover:border-emerald-500/70',
  yellow: 'border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent hover:border-amber-500/70',
  red: 'border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent hover:border-rose-500/60',
}

const BADGE_TIER_STYLES = {
  purple: 'bg-violet-500 text-white',
  green: 'bg-emerald-500 text-white',
  yellow: 'bg-amber-500 text-slate-900',
  red: 'bg-rose-500 text-white',
}

export default function CalendarDashboard({
  user,
  onLogout,
  activeSession,
  onStopActiveTimer,
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [scoreByDate, setScoreByDate] = useState({})
  const [scoreError, setScoreError] = useState('')
  const [isLoadingScores, setIsLoadingScores] = useState(false)

  const todayKey = useMemo(() => getDateKey(new Date()), [])
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth])

  useEffect(() => {
    const controller = new AbortController()
    const year = visibleMonth.getFullYear()
    const month = visibleMonth.getMonth() + 1
    apiRequest(`/api/v1/scores/month/${year}/${month}`, {
      signal: controller.signal,
    })
      .then((scores) => {
        const nextScoreByDate = scores.reduce((scoreMap, score) => {
          scoreMap[score.date] = Number(score.total_points) || 0
          return scoreMap
        }, {})
        setScoreByDate(nextScoreByDate)
        setScoreError('')
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setScoreByDate({})
        setScoreError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingScores(false)
        }
      })

    return () => controller.abort()
  }, [visibleMonth])

  function moveMonth(monthOffset) {
    setIsLoadingScores(true)
    setVisibleMonth((currentMonth) => {
      return new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + monthOffset,
        1,
      )
    })
  }

  function jumpToToday() {
    setIsLoadingScores(true)
    const current = new Date()
    setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1))
  }

  // Calculate monthly stats & current streak
  const { totalMonthPoints, streakCount, legendaryCount } = useMemo(() => {
    let points = 0
    let legendary = 0

    Object.values(scoreByDate).forEach((pts) => {
      if (pts > 0) {
        points += pts
        if (pts >= 50) legendary += 1
      }
    })

    // Calculate streak leading up to today
    let streak = 0
    let checkDate = new Date()
    while (true) {
      const k = getDateKey(checkDate)
      const pts = scoreByDate[k]
      if (k === todayKey && (!pts || pts <= 0)) {
        checkDate.setDate(checkDate.getDate() - 1)
        continue
      }
      if (pts && pts > 0) {
        streak += 1
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return {
      totalMonthPoints: points,
      streakCount: streak,
      legendaryCount: legendary,
    }
  }, [scoreByDate, todayKey])

  const flowDaysCount = useMemo(
    () => Object.values(scoreByDate).filter((p) => p >= 40).length,
    [scoreByDate],
  )

  return (
    <ProtectedShell
      user={user}
      onLogout={onLogout}
      activeSession={activeSession}
      onStopActiveTimer={onStopActiveTimer}
    >
      <div className="flex flex-col h-[calc(100vh-5.5rem)] min-h-[580px] max-w-full gap-3 overflow-hidden">
        {/* Compact Single-Line Command Bar (Navigation + Metrics + Legend) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3 shrink-0">
          {/* Left: Month Navigator */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={jumpToToday}
              className="h-8 text-xs font-bold"
            >
              Today
            </Button>

            <div className="flex items-center rounded-xl border border-border/80 bg-card p-0.5 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span
                className="min-w-[8.5rem] text-center text-xs font-extrabold text-foreground tracking-tight"
                aria-live="polite"
              >
                {MONTH_FORMATTER.format(visibleMonth)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Center: Inline High-Density KPI Badges */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold shadow-sm">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-muted-foreground">Streak:</span>
              <span className="font-extrabold text-foreground font-mono-numbers">{streakCount}d</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold shadow-sm">
              <Zap className="h-3.5 w-3.5 text-sky-500" />
              <span className="text-muted-foreground">Month:</span>
              <span className="font-extrabold text-foreground font-mono-numbers">{totalMonthPoints.toFixed(1)} pts</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold shadow-sm">
              <Trophy className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">Flow Days:</span>
              <span className="font-extrabold text-foreground font-mono-numbers">{flowDaysCount}</span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-muted-foreground">Legendary:</span>
              <span className="font-extrabold text-foreground font-mono-numbers">{legendaryCount}</span>
            </div>
          </div>

          {/* Right: Inline Tiers Legend */}
          <div className="hidden md:flex items-center gap-1.5 text-xs">
            {SCORE_TIERS.map(({ level, label, bg }) => (
              <span
                key={level}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold',
                  bg,
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {scoreError && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription role="status">{scoreError}</AlertDescription>
          </Alert>
        )}

        {/* Viewport-Fit Calendar Grid (Without Scroll) */}
        {isLoadingScores ? (
          <Skeleton className="flex-1 w-full rounded-2xl" />
        ) : (
          <div
            className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card"
            role="grid"
            aria-label="Month calendar"
          >
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-border/70 bg-secondary/40 shrink-0" role="row">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  role="columnheader"
                  className="py-2 text-center text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground"
                >
                  {weekday}
                </div>
              ))}
            </div>

            {/* Days grid - fills full remaining height */}
            <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-border/60">
              {calendarDays.map(({ date, key, isCurrentMonth }) => {
                const isFuture = isFutureDate(key)
                const score = isFuture ? 0 : scoreByDate[key] || 0
                const scoreLevel = getScoreLevel(score)
                const isToday = key === todayKey
                const cellLabel = `${DAY_FORMATTER.format(date)}${
                  score ? `, ${score} points` : ''
                }${isFuture ? ', future date' : ''}`

                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    aria-label={cellLabel}
                    aria-current={isToday ? 'date' : undefined}
                    onClick={() => navigateTo(`/day/${key}`)}
                    className={cn(
                      'group relative flex flex-col justify-between p-2 sm:p-2.5 text-left transition-all duration-150 overflow-hidden',
                      !isCurrentMonth && 'bg-secondary/15 opacity-40',
                      isCurrentMonth && !scoreLevel && 'hover:bg-secondary/40',
                      scoreLevel && CELL_TIER_STYLES[scoreLevel],
                      isToday && 'ring-2 ring-inset ring-primary font-bold',
                    )}
                  >
                    {/* Top Row: Day Number & Today indicator */}
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-110',
                          isToday
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-foreground/90',
                        )}
                      >
                        {date.getDate()}
                      </span>

                      {isToday && (
                        <span className="hidden sm:inline-block rounded bg-primary/20 px-1 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-primary">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Score Badge */}
                    {score > 0 ? (
                      <div className="mt-1 flex items-center justify-end">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold font-mono-numbers shadow-sm',
                            BADGE_TIER_STYLES[scoreLevel],
                          )}
                        >
                          {score.toFixed(1)} pts
                        </span>
                      </div>
                    ) : (
                      !isFuture && isCurrentMonth && (
                        <span className="text-[9px] text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors">
                          + Track
                        </span>
                      )
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </ProtectedShell>
  )
}
