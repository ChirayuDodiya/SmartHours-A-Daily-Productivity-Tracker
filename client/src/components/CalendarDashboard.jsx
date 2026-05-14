import { useEffect, useMemo, useState } from 'react'
import {
  getDateKey,
  getCalendarDays,
  getScoreLevel,
  isFutureDate,
  navigateTo,
} from '../utils/helpers'
import { API_URL, WEEKDAYS, MONTH_FORMATTER, DAY_FORMATTER } from '../utils/constants'
import ProtectedShell from './ProtectedShell'

export default function CalendarDashboard({ user, onLogout }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [scoreByDate, setScoreByDate] = useState({})
  const [scoreError, setScoreError] = useState('')
  const todayKey = getDateKey(new Date())
  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth),
    [visibleMonth],
  )

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
        if (err.name === 'AbortError') {
          return
        }

        setScoreByDate({})
        setScoreError(err.message)
      })

    return () => {
      controller.abort()
    }
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
      <section className="calendar-shell" aria-labelledby="dashboard-title">
        <div className="calendar-heading">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 id="dashboard-title">Daily productivity calendar</h1>
          </div>

          <div className="month-controls" aria-label="Month navigation">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
            >
              &lt;
            </button>
            <span aria-live="polite">{MONTH_FORMATTER.format(visibleMonth)}</span>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>
        </div>

        <div
          className="calendar-grid"
          role="grid"
          aria-label="Month calendar"
        >
          {WEEKDAYS.map((weekday) => (
            <div className="weekday-cell" role="columnheader" key={weekday}>
              {weekday}
            </div>
          ))}

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
                className={`day-cell${isCurrentMonth ? '' : ' muted'}${
                  isToday ? ' today' : ''
                }${isFuture ? ' future' : ''}`}
                type="button"
                role="gridcell"
                aria-label={cellLabel}
                aria-current={isToday ? 'date' : undefined}
                onClick={() => navigateTo(`/day/${key}`)}
                key={key}
              >
                <span className="day-number">{date.getDate()}</span>
                <span
                  className={`score-dot${scoreLevel ? ` ${scoreLevel}` : ''}`}
                  title={score ? `${score} points` : undefined}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>

        {scoreError && (
          <p className="calendar-status" role="status">
            {scoreError}
          </p>
        )}
      </section>
    </ProtectedShell>
  )
}
