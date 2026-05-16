import { useEffect, useState } from 'react'
import { ArrowLeft, ListTodo, Plus } from 'lucide-react'
import {
  getDateKey,
  apiRequest,
  formatDateHeading,
  calculatePoints,
} from '../utils/helpers'
import DailyPieChart from './DailyPieChart'
import ProtectedShell from './ProtectedShell'
import TaskCard from './TaskCard'
import PageHeader from './layout/PageHeader'
import EmptyState from './shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
        if (err.name === 'AbortError') return
        setPageStatus({ type: 'error', message: err.message })
      })

    return () => controller.abort()
  }, [date])

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
      await apiRequest(`/api/v1/tasks/${taskId}`, { method: 'DELETE' })
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
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
      const data = await apiRequest(`/api/v1/tasks/${taskId}/start`, { method: 'POST' })
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
      await apiRequest(`/api/v1/tasks/${taskId}/stop`, { method: 'POST' })
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
    <ProtectedShell user={user} onLogout={onLogout}>
      <Button type="button" variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Calendar
      </Button>

      <PageHeader
        eyebrow="Daily view"
        title={formatDateHeading(date)}
        actions={
          <Card className="min-w-[140px] border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total score
              </p>
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {totalScore.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <aside className="space-y-4" aria-label="Add tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" />
                Add custom task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCustomTaskSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="task-name">Name</Label>
                  <Input
                    id="task-name"
                    value={taskName}
                    onChange={(event) => setTaskName(event.target.value)}
                    placeholder="Deep work"
                    maxLength={255}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-weight">Weight</Label>
                  <Input
                    id="task-weight"
                    type="number"
                    value={taskWeight}
                    onChange={(event) => setTaskWeight(event.target.value)}
                    min="-100"
                    max="100"
                    step="0.01"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  Add task
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add from pack</CardTitle>
              <CardDescription>Apply a saved task pack to this day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pack-select">Pack</Label>
                <select
                  id="pack-select"
                  value={selectedPackId}
                  onChange={(event) => setSelectedPackId(event.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a pack</option>
                  {packs.map((pack) => (
                    <option value={pack.id} key={pack.id}>
                      {pack.name} ({pack.tasks.length})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleApplyPack}
                disabled={isSubmitting || !selectedPackId}
              >
                Apply pack
              </Button>
            </CardContent>
          </Card>
        </aside>

        <section aria-labelledby="task-list-title">
          <Card>
            <CardHeader>
              <CardTitle id="task-list-title" className="flex items-center gap-2 text-base">
                <ListTodo className="h-4 w-4" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canStartTimers && (
                <Alert variant="warning">
                  <AlertDescription>
                    Timers can only be started for today. You can still view this day.
                  </AlertDescription>
                </Alert>
              )}

              {tasks.length === 0 ? (
                <EmptyState
                  icon={ListTodo}
                  title="No tasks yet"
                  description="Add a custom task or apply a pack to get started."
                />
              ) : (
                <div className="space-y-3">
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

              {pageStatus.message && (
                <Alert variant={pageStatus.type === 'error' ? 'destructive' : 'success'}>
                  <AlertDescription role="status">{pageStatus.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <DailyPieChart date={date} refreshTrigger={chartRefreshTick} />
    </ProtectedShell>
  )
}
