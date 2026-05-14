import { useEffect, useState } from 'react'
import {
  getDateKey,
  apiRequest,
  formatDateHeading,
  calculatePoints,
  formatDuration,
} from '../utils/helpers'
import DailyPieChart from './DailyPieChart'


export default function DailyPageShell({ date, user, onBack, onLogout }) {
  const [tasks, setTasks] = useState([])
  const [packs, setPacks] = useState([])
  const [taskName, setTaskName] = useState('')
  const [taskWeight, setTaskWeight] = useState('1')
  const [selectedPackId, setSelectedPackId] = useState('')
  const [activeSession, setActiveSession] = useState(null)
  const [nowTick, setNowTick] = useState(0)
  const [pageStatus, setPageStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [chartRefreshTick, setChartRefreshTick] = useState(0)
  const canStartTimers = date === getDateKey(new Date())

  function getTaskElapsedSeconds(task) {
    const savedSeconds = Number(task.total_seconds) || 0

    if (String(activeSession?.task_id) !== String(task.id)) {
      return savedSeconds
    }

    const startedAt = Date.parse(activeSession.start_time)

    if (Number.isNaN(startedAt)) {
      return savedSeconds
    }

    return savedSeconds + Math.max(0, Math.floor((nowTick - startedAt) / 1000))
  }

  const totalScore = tasks.reduce((sum, task) => {
    return sum + calculatePoints(getTaskElapsedSeconds(task), task.weight)
  }, 0)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      apiRequest(`/api/v1/tasks/${date}`, { signal: controller.signal }),
      apiRequest('/api/v1/packs', { signal: controller.signal }),
      apiRequest('/api/v1/sessions/active', { signal: controller.signal }),
    ])
      .then(([nextTasks, nextPacks, activeSessionResponse]) => {
        setTasks(nextTasks)
        setPacks(nextPacks)
        setActiveSession(activeSessionResponse.active_session)
        setPageStatus({ type: '', message: '' })
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          return
        }

        setPageStatus({ type: 'error', message: err.message })
      })

    return () => {
      controller.abort()
    }
  }, [date])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  async function refreshTasks() {
    const nextTasks = await apiRequest(`/api/v1/tasks/${date}`)
    setTasks(nextTasks)
    setChartRefreshTick((tick) => tick + 1)
    return nextTasks
  }

  async function createTask(payload) {
    return apiRequest('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async function handleCustomTaskSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setPageStatus({ type: '', message: '' })

    try {
      const task = await createTask({
        date,
        name: taskName,
        weight: Number(taskWeight),
      })

      setTasks((currentTasks) => [...currentTasks, task])
      setChartRefreshTick((tick) => tick + 1)
      setTaskName('')
      setTaskWeight('1')
    } catch (err) {
      setPageStatus({ type: 'error', message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleApplyPack() {
    const pack = packs.find((packItem) => String(packItem.id) === selectedPackId)

    if (!pack || pack.tasks.length === 0) {
      setPageStatus({
        type: 'error',
        message: 'Select a pack that contains at least one task',
      })
      return
    }

    setIsSubmitting(true)
    setPageStatus({ type: '', message: '' })

    try {
      const createdTasks = await Promise.all(
        pack.tasks.map((task) => {
          return createTask({
            date,
            name: task.name,
            weight: task.weight,
            pack_id: pack.id,
          })
        }),
      )

      setTasks((currentTasks) => [...currentTasks, ...createdTasks])
      setChartRefreshTick((tick) => tick + 1)
      setSelectedPackId('')
    } catch (err) {
      setPageStatus({ type: 'error', message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteTask(taskId) {
    setPageStatus({ type: '', message: '' })

    try {
      await apiRequest(`/api/v1/tasks/${taskId}`, {
        method: 'DELETE',
      })
      setTasks((currentTasks) => {
        return currentTasks.filter((task) => task.id !== taskId)
      })
      setChartRefreshTick((tick) => tick + 1)
      if (String(activeSession?.task_id) === String(taskId)) {
        setActiveSession(null)
      }
    } catch (err) {
      setPageStatus({ type: 'error', message: err.message })
    }
  }

  async function handleStartTimer(taskId) {
    setIsSubmitting(true)
    setPageStatus({ type: '', message: '' })

    try {
      const data = await apiRequest(`/api/v1/tasks/${taskId}/start`, {
        method: 'POST',
      })
      setActiveSession(data.active_session)
      setNowTick((currentTick) => currentTick + 1)
      await refreshTasks()
    } catch (err) {
      setPageStatus({ type: 'error', message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStopTimer(taskId) {
    setIsSubmitting(true)
    setPageStatus({ type: '', message: '' })

    try {
      await apiRequest(`/api/v1/tasks/${taskId}/stop`, {
        method: 'POST',
      })
      setActiveSession(null)
      setNowTick((currentTick) => currentTick + 1)
      await refreshTasks()
    } catch (err) {
      setPageStatus({ type: 'error', message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="protected-shell">
      <nav className="app-nav">
        <strong>SmartHours</strong>
        <div className="nav-actions">
          <span>{user.email}</span>
          <button type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </nav>
      <section className="daily-shell" aria-labelledby="daily-title">
        <div className="daily-heading">
          <div>
            <button className="back-action" type="button" onClick={onBack}>
              &lt; Calendar
            </button>
            <p className="eyebrow">Daily view</p>
            <h1 id="daily-title">{formatDateHeading(date)}</h1>
          </div>

          <div className="daily-score" aria-label="Total daily score">
            <span>Total score</span>
            <strong>{totalScore.toFixed(1)}</strong>
          </div>
        </div>

        <div className="daily-workspace">
          <section className="task-tools" aria-label="Add tasks">
            <form className="task-form" onSubmit={handleCustomTaskSubmit}>
              <h2>Add custom task</h2>
              <label htmlFor="task-name">
                Name
                <input
                  id="task-name"
                  value={taskName}
                  onChange={(event) => setTaskName(event.target.value)}
                  placeholder="Deep work"
                  maxLength="255"
                  required
                />
              </label>

              <label htmlFor="task-weight">
                Weight
                <input
                  id="task-weight"
                  type="number"
                  value={taskWeight}
                  onChange={(event) => setTaskWeight(event.target.value)}
                  min="-100"
                  max="100"
                  step="0.01"
                  placeholder="1.5"
                  required
                />
              </label>

              <button className="primary-action" type="submit" disabled={isSubmitting}>
                Add task
              </button>
            </form>

            <div className="pack-picker">
              <h2>Add from pack</h2>
              <label htmlFor="pack-select">
                Pack
                <select
                  id="pack-select"
                  value={selectedPackId}
                  onChange={(event) => setSelectedPackId(event.target.value)}
                >
                  <option value="">Select a pack</option>
                  {packs.map((pack) => (
                    <option value={pack.id} key={pack.id}>
                      {pack.name} ({pack.tasks.length})
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="secondary-action"
                type="button"
                onClick={handleApplyPack}
                disabled={isSubmitting || !selectedPackId}
              >
                Apply pack
              </button>
            </div>
          </section>

          <section className="task-list-panel" aria-labelledby="task-list-title">
            <h2 id="task-list-title">Tasks</h2>

            {!canStartTimers && (
              <p className="timer-note">
                Timers can only be started for today. You can still view this day.
              </p>
            )}

            {tasks.length === 0 ? (
              <p className="empty-state">No tasks added for this day yet.</p>
            ) : (
              <div className="task-list">
                {tasks.map((task) => (
                  <article
                    className={`task-card${
                      String(activeSession?.task_id) === String(task.id)
                        ? ' active'
                        : ''
                    }`}
                    key={task.id}
                  >
                    <div className="task-card-main">
                      <h3>{task.name}</h3>
                      <span className="weight-badge">Weight {task.weight}</span>
                    </div>
                    <div className="timer-display" aria-label="Elapsed time">
                      {formatDuration(getTaskElapsedSeconds(task))}
                    </div>
                    <div className="timer-actions">
                      <button
                        className="start-action"
                        type="button"
                        onClick={() => handleStartTimer(task.id)}
                        disabled={
                          !canStartTimers ||
                          isSubmitting ||
                          String(activeSession?.task_id) === String(task.id)
                        }
                      >
                        Start
                      </button>
                      <button
                        className="stop-action"
                        type="button"
                        onClick={() => handleStopTimer(task.id)}
                        disabled={
                          isSubmitting ||
                          String(activeSession?.task_id) !== String(task.id)
                        }
                      >
                        Stop
                      </button>
                      <button
                        className="remove-action"
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        aria-label={`Remove ${task.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {pageStatus.message && (
              <p className={`form-status ${pageStatus.type}`} role="status">
                {pageStatus.message}
              </p>
            )}
          </section>
        </div>

        <DailyPieChart date={date} refreshTrigger={chartRefreshTick} />
      </section>
    </main>

  )
}
