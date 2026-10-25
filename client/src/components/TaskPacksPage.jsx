import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Package,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import ProtectedShell from './ProtectedShell'
import PageHeader from './layout/PageHeader'
import EmptyState from './shared/EmptyState'
import { apiRequest, getDateKey, navigateTo } from '../utils/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const PRESET_STARTER_PACKS = [
  {
    name: '🚀 Full-Stack Dev Sprint',
    tasks: [
      { name: 'Core Architecture & Implementation', weight: 2.0 },
      { name: 'Code Review & Pull Requests', weight: 1.0 },
      { name: 'Testing & Documentation', weight: 1.2 },
    ],
  },
  {
    name: '📚 Deep Study & Research',
    tasks: [
      { name: 'Active Problem Solving', weight: 2.0 },
      { name: 'Deep Reading & Synthesis', weight: 1.5 },
      { name: 'Flashcards & Active Recall', weight: 1.0 },
    ],
  },
  {
    name: '⚡ Morning Momentum',
    tasks: [
      { name: 'Priority Project Deep Work', weight: 2.0 },
      { name: 'Inbox Zero & Triage', weight: 0.8 },
      { name: 'Daily Planning & Specs', weight: 1.2 },
    ],
  },
]

export default function TaskPacksPage({
  user,
  onLogout,
  activeSession,
  onStopActiveTimer,
}) {
  const [packs, setPacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [formState, setFormState] = useState({ isOpen: false, isEdit: false, pack: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [applyingPackId, setApplyingPackId] = useState(null)

  const todayKey = getDateKey(new Date())

  useEffect(() => {
    fetchPacks()
  }, [])

  async function fetchPacks() {
    try {
      setIsLoading(true)
      const data = await apiRequest('/api/v1/packs')
      setPacks(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await apiRequest(`/api/v1/packs/${deleteTarget.id}`, { method: 'DELETE' })
      setPacks((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
      setActionSuccess(`Deleted pack "${deleteTarget.name}"`)
      setTimeout(() => setActionSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleApplyToToday(pack) {
    if (!pack || !pack.tasks?.length) return
    try {
      setApplyingPackId(pack.id)
      await Promise.all(
        pack.tasks.map((task) =>
          apiRequest('/api/v1/tasks', {
            method: 'POST',
            body: JSON.stringify({
              date: todayKey,
              name: task.name,
              weight: task.weight,
              pack_id: pack.id,
            }),
          }),
        ),
      )
      setActionSuccess(`Applied ${pack.tasks.length} tasks from "${pack.name}" to Today!`)
      setTimeout(() => setActionSuccess(''), 4000)
    } catch (err) {
      setError(`Failed to apply pack: ${err.message}`)
    } finally {
      setApplyingPackId(null)
    }
  }

  async function handleCreateStarterPack(preset) {
    try {
      setIsLoading(true)
      await apiRequest('/api/v1/packs', {
        method: 'POST',
        body: JSON.stringify(preset),
      })
      await fetchPacks()
      setActionSuccess(`Created starter template "${preset.name}"!`)
      setTimeout(() => setActionSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  function openCreateForm() {
    setFormState({
      isOpen: true,
      isEdit: false,
      pack: { name: '', tasks: [{ name: '', weight: 1 }] },
    })
  }

  function openEditForm(pack) {
    setFormState({
      isOpen: true,
      isEdit: true,
      pack: {
        id: pack.id,
        name: pack.name,
        tasks: pack.tasks.length
          ? pack.tasks.map((t) => ({ id: t.id, name: t.name, weight: t.weight }))
          : [{ name: '', weight: 1 }],
      },
    })
  }

  function closeForm() {
    setFormState({ isOpen: false, isEdit: false, pack: null })
  }

  return (
    <ProtectedShell
      user={user}
      onLogout={onLogout}
      activeSession={activeSession}
      onStopActiveTimer={onStopActiveTimer}
    >
      <div className="page-stack">
        <PageHeader
          eyebrow="Reusable Routines"
          title="Task Templates"
          description="Design high-yield daily routines and apply entire bundles of tasks to your day in 1 click."
          actions={
            <Button
              type="button"
              onClick={openCreateForm}
              className="gap-1.5 font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          }
        />

        {actionSuccess && (
          <Alert variant="success" className="animate-in-fade">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-2" />
            <AlertDescription className="flex items-center justify-between w-full">
              <span>{actionSuccess}</span>
              <button
                type="button"
                onClick={() => navigateTo(`/day/${todayKey}`)}
                className="font-bold underline ml-2"
              >
                Go to Today →
              </button>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : packs.length === 0 ? (
          <div className="space-y-6">
            <EmptyState
              icon={Package}
              title="No task templates yet"
              description="Create recurring routines or start with one of our recommended high-focus presets below."
              action={
                <Button type="button" onClick={openCreateForm}>
                  <Plus className="h-4 w-4" />
                  Create Custom Template
                </Button>
              }
              className="py-12 bg-card"
            />

            {/* Starter Presets */}
            <div className="rounded-2xl border border-border/80 bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold tracking-tight text-foreground">
                  Quick Start: Recommended Templates
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {PRESET_STARTER_PACKS.map((preset) => (
                  <div
                    key={preset.name}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-secondary/40 p-4 transition-all hover:border-primary/40"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{preset.name}</h4>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {preset.tasks.map((t) => (
                          <li key={t.name}>
                            • {t.name} <span className="font-semibold">({t.weight}x)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full font-semibold"
                      onClick={() => handleCreateStarterPack(preset)}
                    >
                      + Add this template
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => {
              const totalWeight = pack.tasks.reduce(
                (sum, t) => sum + (Number(t.weight) || 1),
                0,
              )
              const isApplying = applyingPackId === pack.id

              return (
                <div
                  key={pack.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-border"
                >
                  <div>
                    {/* Header: Name, Count, Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-foreground tracking-tight" title={pack.name}>
                          {pack.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {pack.tasks.length} task{pack.tasks.length !== 1 ? 's' : ''} · {totalWeight.toFixed(1)}x cumulative weight
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditForm(pack)}
                          aria-label={`Edit ${pack.name}`}
                          title="Edit template"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(pack)}
                          aria-label={`Delete ${pack.name}`}
                          title="Delete template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Task list preview */}
                    <div className="mt-4 space-y-1.5 border-t border-border/50 pt-3">
                      {pack.tasks.slice(0, 4).map((task) => (
                        <div
                          key={task.id || task.name}
                          className="flex items-center justify-between text-xs text-muted-foreground"
                        >
                          <span className="truncate pr-2 text-foreground/90 font-medium">
                            {task.name}
                          </span>
                          <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-foreground font-mono-numbers">
                            {task.weight}x
                          </span>
                        </div>
                      ))}
                      {pack.tasks.length > 4 && (
                        <p className="text-[11px] text-muted-foreground/70 pt-0.5 font-medium">
                          +{pack.tasks.length - 4} more tasks
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Apply to Today Button */}
                  <div className="mt-5 border-t border-border/50 pt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full gap-1.5 font-semibold text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                      disabled={isApplying}
                      onClick={() => handleApplyToToday(pack)}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      {isApplying ? 'Applying…' : 'Apply to Today'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        {formState.isOpen && (
          <PackFormDialog
            open={formState.isOpen}
            initialPack={formState.pack}
            isEdit={formState.isEdit}
            onClose={closeForm}
            onSuccess={() => {
              closeForm()
              fetchPacks()
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Delete template?</DialogTitle>
              <DialogDescription>
                This will permanently remove &quot;{deleteTarget?.name}&quot;. Existing tasks already created on days will not be affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedShell>
  )
}

function PackFormDialog({ open, initialPack, isEdit, onClose, onSuccess }) {
  const [name, setName] = useState(initialPack?.name || '')
  const [tasks, setTasks] = useState(
    initialPack?.tasks?.length
      ? initialPack.tasks
      : [{ name: '', weight: 1.5 }],
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleTaskChange(index, field, value) {
    const newTasks = [...tasks]
    newTasks[index][field] = value
    setTasks(newTasks)
  }

  function addTask() {
    setTasks([...tasks, { name: '', weight: 1.5 }])
  }

  function removeTask(index) {
    const newTasks = tasks.filter((_, i) => i !== index)
    setTasks(newTasks.length ? newTasks : [{ name: '', weight: 1.5 }])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validTasks = tasks.filter((t) => t.name.trim() !== '')
    if (validTasks.length === 0) {
      setError('At least one task with a name is required')
      return
    }

    const payload = {
      name: name.trim(),
      tasks: validTasks.map((t) => ({
        ...(t.id !== undefined && t.id !== null ? { id: Number(t.id) } : {}),
        name: t.name.trim(),
        weight: Number(t.weight) || 1,
      })),
    }

    try {
      setIsSubmitting(true)
      if (isEdit) {
        await apiRequest(`/api/v1/packs/${initialPack.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest('/api/v1/packs', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      onSuccess()
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Template' : 'Create Task Template'}</DialogTitle>
          <DialogDescription>
            Define routines with custom multiplier weights. Apply them anytime in 1 click.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="pack-name">Template Name</Label>
            <Input
              id="pack-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deep Work Sprint, Morning Launch"
              required
              maxLength={255}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tasks & Multipliers</Label>
              <span className="text-[11px] text-muted-foreground">Name & Weight (0.1 - 100)</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_90px_auto] gap-2 items-center"
                >
                  <Input
                    placeholder="Task name"
                    value={task.name}
                    onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                    required={index === 0}
                    className="rounded-xl"
                  />
                  <Input
                    type="number"
                    placeholder="Weight"
                    min="-100"
                    max="100"
                    step="0.1"
                    value={task.weight}
                    onChange={(e) => handleTaskChange(index, 'weight', e.target.value)}
                    required={index === 0}
                    className="rounded-xl text-center font-mono-numbers"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTask(index)}
                    aria-label="Remove task"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full text-xs font-semibold rounded-xl"
              onClick={addTask}
            >
              + Add another task
            </Button>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="font-bold bg-primary text-primary-foreground"
            >
              {isSubmitting ? 'Saving…' : 'Save Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
