import { useEffect, useState, useMemo, useRef } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Package,
  Plus,
  Sparkles,
  Square,
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
import { playMilestone, playTimerStop } from '@/utils/soundEffects'

const WEIGHT_PRESETS = [
  { label: '1.0x', value: '1' },
  { label: '1.5x Deep', value: '1.5' },
  { label: '2.0x Hard', value: '2' },
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
        message: `Applied template "${pack.name}" (${createdTasks.length} tasks added)`,
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
      playTimerStop()
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

  function stepDate(daysOffset) {
    const current = new Date(`${date}T12:00:00`)
    current.setDate(current.getDate() + daysOffset)
    navigateTo(`/day/${getDateKey(current)}`)
  }

  // Active task object for top hero
  const activeTask = useMemo(() => {
    if (!activeSession) return null
    return tasks.find((t) => String(t.id) === String(activeSession.task_id)) || null
  }, [activeSession, tasks])

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
      <div className="flex flex-col gap-4 max-w-full">
        {/* Top Control Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-bold"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Calendar
            </Button>

            <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-card p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => stepDate(-1)}
                title="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs font-extrabold text-foreground">
                {formatDateHeading(date)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => stepDate(1)}
                title="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!canStartTimers && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 text-xs font-bold text-amber-500"
                onClick={() => navigateTo(`/day/${todayKey}`)}
              >
                Jump to Today
              </Button>
            )}

            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-1 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground">Today:</span>
              <span className="text-sm font-extrabold text-foreground font-mono-numbers">
                {totalScore.toFixed(1)} pts
              </span>
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', scoreTier.color)}>
                {scoreGoalPercent}%
              </span>
            </div>
          </div>
        </div>

        {pageStatus.message && (
          <Alert variant={pageStatus.type === 'error' ? 'destructive' : 'success'} className="py-2">
            <AlertDescription role="status">{pageStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Ergonomic Split Layout: Tasks & Immediate Controls on LEFT, Stats & Donut on RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* PRIMARY WORKSPACE (Left 7 Cols): Start Timer Immediately Above the Fold! */}
          <div className="lg:col-span-7 space-y-4">
            {/* ACTIVE SESSION HERO (If a timer is running, prominent glowing card right at the top!) */}
            {activeSession && activeTask && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-sky-500/60 bg-gradient-to-r from-sky-500/15 via-card to-card p-4 sm:p-5 shadow-xl ring-2 ring-sky-500/20 animate-pulse-glow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                      Focus Session in Progress
                    </span>
                  </div>
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-primary font-mono-numbers">
                    {activeTask.weight}x Multiplier
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xl font-extrabold tracking-tight text-foreground">
                    {activeTask.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono-numbers text-3xl font-extrabold text-foreground tracking-tight">
                      {formatDuration(getTaskElapsedSeconds(activeTask))}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-500 font-mono-numbers">
                      +{calculatePoints(getTaskElapsedSeconds(activeTask), activeTask.weight).toFixed(1)} pts
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="gap-2 font-bold shadow-md h-9 px-5"
                    onClick={() => handleStopTimer(activeTask.id)}
                    disabled={isSubmitting}
                  >
                    <Square className="h-4 w-4" />
                    Stop Active Timer
                  </Button>
                </div>
              </div>
            )}

            {/* QUICK ADD TASK BAR (Right at the top so adding and starting is effortless!) */}
            <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-card">
              <form onSubmit={handleCustomTaskSubmit} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Input
                    id="task-name"
                    value={taskName}
                    onChange={(event) => setTaskName(event.target.value)}
                    placeholder="Focus task name... (e.g. System Design, Code Review)"
                    maxLength={255}
                    required
                    className="h-10 rounded-xl border-border bg-secondary/30 px-3.5 text-xs sm:text-sm font-medium"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {!customWeightMode ? (
                    <div className="flex items-center gap-1">
                      {WEIGHT_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setTaskWeight(preset.value)}
                          className={cn(
                            'rounded-lg px-2 py-1.5 text-xs font-bold transition-colors border',
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
                        className="rounded px-1.5 py-1 text-[11px] text-muted-foreground hover:text-foreground underline"
                      >
                        Custom
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={taskWeight}
                        onChange={(event) => setTaskWeight(event.target.value)}
                        min="-100"
                        max="100"
                        step="0.1"
                        className="h-10 w-20 text-center font-mono-numbers font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomWeightMode(false)}
                        className="text-[11px] text-muted-foreground underline"
                      >
                        Presets
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || !taskName.trim()}
                    className="h-10 rounded-xl px-4 font-bold shadow-sm bg-primary text-primary-foreground gap-1.5 text-xs shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Task
                  </Button>
                </div>
              </form>
            </div>

            {/* FOCUS TASKS LIST (2 Columns, right here above the fold!) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-primary" />
                  Tasks ({tasks.length})
                </h2>
                {!canStartTimers && (
                  <span className="text-[11px] text-amber-500 font-semibold">
                    Viewing {date} — timers active for today only
                  </span>
                )}
              </div>

              {tasks.length === 0 ? (
                <EmptyState
                  icon={ListTodo}
                  title="No tasks yet for this day"
                  description="Type a task above or apply a template from the right panel to get started."
                  className="py-10 bg-card rounded-2xl"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>
          </div>

          {/* COMPANION SIDEBAR (Right 5 Cols): Stats, Goal Ring, Donut Chart & Quick Packs */}
          <div className="lg:col-span-5 space-y-4">
            {/* Daily Score & Goal Target Card */}
            <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Productivity Score
                </span>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold', scoreTier.color)}>
                  <Sparkles className="h-3 w-3" />
                  {scoreTier.label}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono-numbers">
                    {totalScore.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">pts</span>
                </div>

                <div className="text-right text-xs">
                  <span className="text-muted-foreground">Focused: </span>
                  <span className="font-extrabold text-foreground font-mono-numbers">
                    {formatDuration(totalSeconds)}
                  </span>
                </div>
              </div>

              {/* Progress bar towards 40 pts goal */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-muted-foreground">40 pts Flow Goal</span>
                  <span className="font-bold text-foreground font-mono-numbers">{scoreGoalPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full transition-all duration-500 ease-out', scoreTier.barColor)}
                    style={{ width: `${scoreGoalPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Daily Breakdown Donut Chart (Hover slices for % share & task name) */}
            <DailyPieChart
              key={`${date}-${chartRefreshTick}`}
              date={date}
              refreshTrigger={chartRefreshTick}
            />

            {/* Quick Apply Templates (Task Packs) */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Quick Templates
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('/packs')}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Manage →
                </button>
              </div>

              {packs.length === 0 ? (
                <div className="rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground text-center">
                  <span>No templates created yet.</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {packs.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => handleApplyPackDirect(pack)}
                      disabled={isSubmitting}
                      className="group flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/60 hover:bg-primary/10 hover:border-primary/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-all duration-150 disabled:opacity-50"
                      title={`Add ${pack.tasks.length} tasks from ${pack.name}`}
                    >
                      <Plus className="h-3 w-3 text-primary transition-transform group-hover:scale-125" />
                      <span className="truncate max-w-[120px]">{pack.name}</span>
                      <span className="rounded bg-background px-1 text-[10px] text-muted-foreground font-mono-numbers">
                        {pack.tasks.length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedShell>
  )
}
