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
} from '../utils/helpers'
import { API_URL, WEEKDAYS, MONTH_FORMATTER, DAY_FORMATTER } from '../utils/constants'
import ProtectedShell from './ProtectedShell'
import PageHeader from './layout/PageHeader'
import StatCard from './shared/StatCard'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const SCORE_TIERS = [
  { level: 'purple', label: '50+ Legendary', bg: 'bg-violet-500/15 text-violet-500 border-violet-500/30' },
  { level: 'green', label: '40–49 Target Reached', bg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  { level: 'yellow', label: '30–39 In Momentum', bg: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  { level: 'red', label: '<30 Warming Up', bg: 'bg-rose-500/15 text-rose-500 border-rose-500/30' },
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

    fetch(`${API_URL}/api/v1/scores/month/${year}/${month}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || 'Scores could not be loaded')
        }
        return data
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
  const { totalMonthPoints, activeDaysCount, streakCount, legendaryCount } = useMemo(() => {
    let points = 0
    let activeDays = 0
    let legendary = 0

    Object.values(scoreByDate).forEach((pts) => {
      if (pts > 0) {
        points += pts
        activeDays += 1
        if (pts >= 50) legendary += 1
      }
    })

    // Calculate streak leading up to today
    let streak = 0
    let checkDate = new Date()
    while (true) {
      const k = getDateKey(checkDate)
      const pts = scoreByDate[k]
      // For today, if 0, check if yesterday had points to keep streak active
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
      activeDaysCount: activeDays,
      streakCount: streak,
      legendaryCount: legendary,
    }
  }, [scoreByDate, todayKey])

  return (
    <ProtectedShell
      user={user}
      onLogout={onLogout}
      activeSession={activeSession}
      onStopActiveTimer={onStopActiveTimer}
    >
      <div className="page-stack">
        <PageHeader
          eyebrow="Monthly Overview"
          title="Productivity Momentum"
          description="Build unbroken focus streaks. Color tiers visually measure your daily output."
          actions={
            <div className="flex items-center gap-2" aria-label="Month navigation">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={jumpToToday}
                className="font-semibold text-xs"
              >
                Today
              </Button>
              <div className="flex items-center rounded-xl border border-border/80 bg-card p-1 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveMonth(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span
                  className="min-w-[9.5rem] text-center text-xs font-bold text-foreground"
                  aria-live="polite"
                >
                  {MONTH_FORMATTER.format(visibleMonth)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveMonth(1)}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          }
        />

        {/* Highlight KPI Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Month Output"
            value={`${totalMonthPoints.toFixed(1)} pts`}
            subvalue={`${activeDaysCount} active days recorded`}
            icon={Zap}
          />
          <StatCard
            label="Current Streak"
            value={`${streakCount} Days`}
            subvalue={streakCount > 0 ? 'Momentum chain active' : 'Start a task today to ignite streak'}
            icon={Flame}
          />
          <StatCard
            label="Flow Days (40+)"
            value={`${Object.values(scoreByDate).filter((p) => p >= 40).length} Days`}
            subvalue="Target 40 pts reached"
            icon={Trophy}
          />
          <StatCard
            label="Legendary (50+)"
            value={`${legendaryCount} Days`}
            subvalue="Ultra-deep work sessions"
            icon={Sparkles}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground mr-1">Tiers:</span>
          {SCORE_TIERS.map(({ level, label, bg }) => (
            <span
              key={level}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                bg,
              )}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {label}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        {isLoadingScores ? (
          <Skeleton className="h-[460px] w-full rounded-2xl" />
        ) : (
          <div
            className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card"
            role="grid"
            aria-label="Month calendar"
          >
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-border/70 bg-secondary/40" role="row">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  role="columnheader"
                  className="py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {weekday}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
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
                      'group relative flex min-h-[5.5rem] sm:min-h-[6.5rem] flex-col justify-between p-2.5 sm:p-3 text-left transition-all duration-150',
                      !isCurrentMonth && 'bg-secondary/20 opacity-40',
                      isCurrentMonth && !scoreLevel && 'hover:bg-secondary/40',
                      scoreLevel && CELL_TIER_STYLES[scoreLevel],
                      isToday && 'ring-2 ring-inset ring-primary font-bold',
                    )}
                  >
                    {/* Top row of cell: Day Number and Today Badge */}
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-110',
                          isToday
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-foreground/90',
                        )}
                      >
                        {date.getDate()}
                      </span>

                      {isToday && (
                        <span className="hidden sm:inline-block rounded-md bg-primary/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Bottom row of cell: Score Display */}
                    {score > 0 ? (
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-[11px] font-extrabold font-mono-numbers shadow-sm',
                            BADGE_TIER_STYLES[scoreLevel],
                          )}
                        >
                          {score.toFixed(1)} pts
                        </span>
                      </div>
                    ) : (
                      !isFuture && isCurrentMonth && (
                        <span className="text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
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

        {scoreError && (
          <Alert variant="destructive">
            <AlertDescription role="status">{scoreError}</AlertDescription>
          </Alert>
        )}
      </div>
    </ProtectedShell>
  )
}
