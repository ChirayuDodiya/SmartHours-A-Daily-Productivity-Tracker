import { useEffect, useState, useMemo, useRef } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Package,
  Plus,
  Sparkles,
} from 'lucide-react'
import {
  getDateKey,
  apiRequest,
  formatDateHeading,
  calculatePoints,
  formatDuration,
  navigateTo,
} from '../utils/helpers'
import DailyPieChart from './DailyPieChart'
import ProtectedShell from './ProtectedShell'
import TaskCard from './TaskCard'
import EmptyState from './shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { playMilestone } from '@/utils/soundEffects'

const WEIGHT_PRESETS = [
  { label: '1.0x Normal', value: '1' },
  { label: '1.5x Deep', value: '1.5' },
  { label: '2.0x Intense', value: '2' },
  { label: '0.5x Light', value: '0.5' },
]

export default function DailyPageShell({
  date,
  user,
  onBack,
  onLogout,
  activeSession: globalActiveSession,
  onStopActiveTimer,
}) {
  const [tasks, setTasks] = useState([])
  const [packs, setPacks] = useState([])
  const [taskName, setTaskName] = useState('')
  const [taskWeight, setTaskWeight] = useState('1.5')
  const [customWeightMode, setCustomWeightMode] = useState(false)
  const [localActiveSession, setLocalActiveSession] = useState(null)
  const activeSession = localActiveSession !== null ? localActiveSession : (globalActiveSession || null)
  const [nowTick, setNowTick] = useState(0)
  const [pageStatus, setPageStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [chartRefreshTick, setChartRefreshTick] = useState(0)
  const celebratedRef = useRef(false)

  const todayKey = getDateKey(new Date())
  const canStartTimers = date === todayKey

  function getTaskElapsedSeconds(task) {
    const savedSeconds = Number(task.total_seconds) || 0
    if (String(activeSession?.task_id) !== String(task.id)) {
      return savedSeconds
    }
    const startedAt = Date.parse(activeSession.start_time)
    if (Number.isNaN(startedAt) || nowTick === 0) {
      return savedSeconds
    }
    return savedSeconds + Math.max(0, Math.floor((nowTick - startedAt) / 1000))
  }

  // Calculate live total points and seconds
  const { totalScore, totalSeconds } = useMemo(() => {
    let score = 0
    let seconds = 0
    tasks.forEach((task) => {
      const savedSeconds = Number(task.total_seconds) || 0
      let elapsed = savedSeconds
      if (String(activeSession?.task_id) === String(task.id)) {
        const startedAt = Date.parse(activeSession.start_time)
        if (!Number.isNaN(startedAt) && nowTick > 0) {
          elapsed = savedSeconds + Math.max(0, Math.floor((nowTick - startedAt) / 1000))
        }
      }
      score += calculatePoints(elapsed, task.weight)
      seconds += elapsed
    })
    return { totalScore: score, totalSeconds: seconds }
  }, [tasks, activeSession, nowTick])

  // Milestone sound trigger when passing 40 points
  useEffect(() => {
    if (totalScore >= 40 && !celebratedRef.current && canStartTimers) {
      celebratedRef.current = true
      playMilestone()
    }
  }, [totalScore, canStartTimers])

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
        setLocalActiveSession(activeSessionResponse.active_session)
        setPageStatus({ type: '', message: '' })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setPageStatus({ type: 'error', message: err.message })
      })

    return () => controller.abort()
  }, [date])

  // Timer ticker
  useEffect(() => {
    const intervalId = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
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
    if (!taskName.trim()) return

    setIsSubmitting(true)
    setPageStatus({ type: '', message: '' })

    try {
      const task = await createTask({
        date,
        name: taskName.trim(),
        weight: Number(taskWeight) || 1,
      })
      setTasks((currentTasks) => [...currentTasks, task])
      setChartRefreshTick((tick) => tick + 1)
      setTaskName('')
      setPageStatus({ type: 'success', message: `Added "${task.name}"` })
      setTimeout(() => setPageStatus({ type: '', message: '' }), 3000)
    } catch (err) {
      setPageStatus({ type: 'error', message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleApplyPackDirect(pack) {
    if (!pack || !pack.tasks?.length) return

    setIsSubmitting(true)
    setPageStatus({ type: '', message: '' })

    try {
      const createdTasks = await Promise.all(
        pack.tasks.map((task) =>
          createTask({
            date,
            name: task.name,
            weight: task.weight,
            pack_id: pack.id,
          }),
        ),
      )
      setTasks((currentTasks) => [...currentTasks, ...createdTasks])
      setChartRefreshTick((tick) => tick + 1)
      setPageStatus({
        type: 'success',
        message: `Applied pack "${pack.name}" (${createdTasks.length} tasks added)`,
      })
      setTimeout(() => setPageStatus({ type: '', message: '' }), 4000)
    } catch (err) {
      setPageStatus({ type: 'error', message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteTask(taskId) {
    setPageStatus({ type: '', message: '' })
    try {
      await apiRequest(`/api/v1/tasks/${taskId}`, { method: 'DELETE' })
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
      setChartRefreshTick((tick) => tick + 1)
      if (String(activeSession?.task_id) === String(taskId)) {
        setLocalActiveSession(null)
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
        body: JSON.stringify({ clientDate: date }),
      })
      setLocalActiveSession(data.active_session)
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
      if (onStopActiveTimer) {
        await onStopActiveTimer(taskId)
      } else {
        await apiRequest(`/api/v1/tasks/${taskId}/stop`, { method: 'POST' })
      }
      setLocalActiveSession(null)
      setNowTick((currentTick) => currentTick + 1)
      await refreshTasks()
    } catch (err) {
      setPageStatus({ type: 'error', message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Date step helper (prev/next day)
  function stepDate(daysOffset) {
    const current = new Date(`${date}T12:00:00`)
    current.setDate(current.getDate() + daysOffset)
    navigateTo(`/day/${getDateKey(current)}`)
  }

  // Determine score status tier
  const scoreGoalPercent = Math.min(100, Math.round((totalScore / 40) * 100))
  let scoreTier = {
    label: 'Under Target',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    barColor: 'bg-rose-500',
  }
  if (totalScore >= 50) {
    scoreTier = {
      label: 'Mastery Zone ⚡',
      color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
      barColor: 'bg-violet-500',
    }
  } else if (totalScore >= 40) {
    scoreTier = {
      label: 'Target Achieved 🎯',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      barColor: 'bg-emerald-500',
    }
  } else if (totalScore >= 30) {
    scoreTier = {
      label: 'In Momentum',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      barColor: 'bg-amber-500',
    }
  }

  return (
    <ProtectedShell
      user={user}
      onLogout={onLogout}
      activeSession={activeSession}
      onStopActiveTimer={handleStopTimer}
    >
      <div className="page-stack">
        {/* Top Navigation & Date Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit gap-1 text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Calendar
          </Button>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => stepDate(-1)}
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs font-semibold text-muted-foreground">
              {canStartTimers ? 'Today' : date}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => stepDate(1)}
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!canStartTimers && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="ml-1 h-8 text-xs font-semibold"
                onClick={() => navigateTo(`/day/${todayKey}`)}
              >
                Jump to Today
              </Button>
            )}
          </div>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-primary/90 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Daily Focus Studio
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {formatDateHeading(date)}
          </h1>
        </div>

        {/* TOP SECTION: Points Card & Breakdown Pie Chart Side-by-Side! (Addressing notes.txt point 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: Score & Goals Card */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 p-6 shadow-card">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Today&apos;s Productivity Score
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                    scoreTier.color,
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  {scoreTier.label}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono-numbers">
                  {totalScore.toFixed(1)}
                </span>
                <span className="text-lg font-semibold text-muted-foreground">pts</span>
              </div>

              {/* Progress bar towards 40 pts goal */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Daily Goal Target (40 pts)</span>
                  <span className="font-semibold text-foreground font-mono-numbers">
                    {scoreGoalPercent}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full transition-all duration-500 ease-out', scoreTier.barColor)}
                    style={{ width: `${scoreGoalPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Focused Time</span>
                <span className="mt-0.5 text-base font-bold text-foreground font-mono-numbers">
                  {formatDuration(totalSeconds)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Active Tasks</span>
                <span className="mt-0.5 text-base font-bold text-foreground font-mono-numbers">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Pie Chart side-by-side with points! */}
          <div className="lg:col-span-7">
            <DailyPieChart
              key={`${date}-${chartRefreshTick}`}
              date={date}
              refreshTrigger={chartRefreshTick}
            />
          </div>
        </div>

        {/* HORIZONTAL QUICK PACKS BAR (Addressing notes.txt point 3: "move that packs option as horizontal bar") */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Quick Apply Templates
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('/packs')}
              className="text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
            >
              Manage Templates →
            </button>
          </div>

          {packs.length === 0 ? (
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
              <span>No task templates created yet. Create reusable packs to batch add tasks in 1 click!</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs font-medium"
                onClick={() => navigateTo('/packs')}
              >
                + Create Pack
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
              {packs.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handleApplyPackDirect(pack)}
                  disabled={isSubmitting}
                  className="group flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/60 hover:bg-primary/10 hover:border-primary/40 px-3.5 py-2 text-xs font-semibold text-foreground transition-all duration-150 disabled:opacity-50"
                  title={`Add ${pack.tasks.length} tasks from ${pack.name}`}
                >
                  <Plus className="h-3.5 w-3.5 text-primary transition-transform group-hover:scale-125" />
                  <span>{pack.name}</span>
                  <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono-numbers">
                    {pack.tasks.length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* QUICK ADD CUSTOM TASK BAR */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-card">
          <form onSubmit={handleCustomTaskSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Input
                id="task-name"
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
                placeholder="What are you focusing on? (e.g. Core Algorithm, Writing Docs)"
                maxLength={255}
                required
                className="h-11 rounded-xl border-border bg-secondary/40 px-4 text-sm font-medium focus-visible:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              {!customWeightMode ? (
                <div className="flex items-center gap-1 overflow-x-auto">
                  {WEIGHT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setTaskWeight(preset.value)}
                      className={cn(
                        'rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors border',
                        taskWeight === preset.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-secondary/60 text-muted-foreground border-border/60 hover:text-foreground',
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomWeightMode(true)}
                    className="rounded-lg px-2 py-2 text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Custom
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={taskWeight}
                    onChange={(event) => setTaskWeight(event.target.value)}
                    min="-100"
                    max="100"
                    step="0.1"
                    className="h-11 w-24 text-center font-mono-numbers font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomWeightMode(false)}
                    className="text-xs text-muted-foreground underline"
                  >
                    Presets
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !taskName.trim()}
                className="h-11 rounded-xl px-5 font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>
          </form>
        </div>

        {/* Notification Message */}
        {pageStatus.message && (
          <Alert variant={pageStatus.type === 'error' ? 'destructive' : 'success'}>
            <AlertDescription role="status">{pageStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* 2-COLUMN RESPONSIVE TASK GRID (Addressing notes.txt point 2: "make daily tasks 2 column") */}
        <section aria-labelledby="task-list-title" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="task-list-title" className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              Focus Tasks ({tasks.length})
            </h2>
            {!canStartTimers && (
              <span className="text-xs text-amber-500 font-medium">
                Viewing past/future date — timers only active for today
              </span>
            )}
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No focus tasks for this day"
              description="Add a task above or apply a template from your packs to start tracking."
              className="py-14 bg-card"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  elapsedSeconds={getTaskElapsedSeconds(task)}
                  isActive={String(activeSession?.task_id) === String(task.id)}
                  isSubmitting={isSubmitting}
                  canStartTimers={canStartTimers}
                  onStart={() => handleStartTimer(task.id)}
                  onStop={() => handleStopTimer(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </ProtectedShell>
  )
}
