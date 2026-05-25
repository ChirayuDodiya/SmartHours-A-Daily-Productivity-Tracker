import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const SCORE_LEGEND = [
  { level: 'red', label: 'Under 30', color: 'bg-red-500' },
  { level: 'yellow', label: '30–39', color: 'bg-amber-500' },
  { level: 'green', label: '40–49', color: 'bg-emerald-500' },
  { level: 'purple', label: '50+', color: 'bg-violet-500' },
]

const DOT_COLORS = {
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
}

export default function CalendarDashboard({ user, onLogout }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [scoreByDate, setScoreByDate] = useState({})
  const [scoreError, setScoreError] = useState('')
  const [isLoadingScores, setIsLoadingScores] = useState(true)
  const todayKey = getDateKey(new Date())
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth])

  useEffect(() => {
    const controller = new AbortController()
    const year = visibleMonth.getFullYear()
    const month = visibleMonth.getMonth() + 1
    setIsLoadingScores(true)

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
    setVisibleMonth((currentMonth) => {
      return new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + monthOffset,
        1,
      )
    })
  }

  return (
    <ProtectedShell user={user} onLogout={onLogout}>
      <div className="page-stack">
      <PageHeader
        eyebrow="Dashboard"
        title="Productivity calendar"
        description="Track daily scores and open any day to manage tasks."
        actions={
          <div className="flex items-center gap-2" aria-label="Month navigation">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span
              className="min-w-[10rem] text-center text-sm font-semibold text-foreground"
              aria-live="polite"
            >
              {MONTH_FORMATTER.format(visibleMonth)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {SCORE_LEGEND.map(({ level, label, color }) => (
          <span key={level} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', color)} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>

      {isLoadingScores ? (
        <Skeleton className="h-[420px] w-full rounded-xl" />
      ) : (
        <div
          className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
          role="grid"
          aria-label="Month calendar"
        >
          <div className="grid grid-cols-7 border-b border-border bg-muted/40" role="row">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                role="columnheader"
                className="py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
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
                    'relative flex min-h-[4.5rem] flex-col items-start justify-between border-b border-r border-border p-2 text-left transition-colors duration-150 hover:bg-accent/60 sm:min-h-[5.5rem] sm:p-3',
                    !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                    isToday && 'bg-primary/5 ring-2 ring-inset ring-primary',
                    isFuture && 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                      isToday && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {date.getDate()}
                  </span>
                  {scoreLevel && (
                    <span
                      className={cn(
                        'absolute right-2 top-2 h-2 w-2 rounded-full',
                        DOT_COLORS[scoreLevel],
                      )}
                      title={`${score} points`}
                      aria-hidden="true"
                    />
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
