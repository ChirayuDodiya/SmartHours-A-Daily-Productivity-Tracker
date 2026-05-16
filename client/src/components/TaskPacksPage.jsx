import { useState, useEffect } from 'react'
import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import ProtectedShell from './ProtectedShell'
import PageHeader from './layout/PageHeader'
import EmptyState from './shared/EmptyState'
import { apiRequest } from '../utils/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function TaskPacksPage({ user, onLogout }) {
  const [packs, setPacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formState, setFormState] = useState({ isOpen: false, isEdit: false, pack: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    } catch (err) {
      setError(err.message)
    } finally {
      setIsDeleting(false)
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
    <ProtectedShell user={user} onLogout={onLogout}>
      <PageHeader
        eyebrow="Settings"
        title="Task packs"
        description="Create reusable task templates to apply to any day."
        actions={
          <Button type="button" onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Create pack
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : packs.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No task packs yet"
          description="Create a pack to quickly add groups of tasks to your day."
          action={
            <Button type="button" onClick={openCreateForm}>
              <Plus className="h-4 w-4" />
              Create pack
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => (
            <Card key={pack.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{pack.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditForm(pack)}
                      aria-label={`Edit ${pack.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(pack)}
                      aria-label={`Delete ${pack.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {pack.tasks.length} task{pack.tasks.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {pack.tasks.slice(0, 3).map((task) => (
                    <li key={task.id || task.name}>
                      {task.name}{' '}
                      <span className="text-xs">(w: {task.weight})</span>
                    </li>
                  ))}
                  {pack.tasks.length > 3 && (
                    <li className="text-xs">+{pack.tasks.length - 3} more</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete pack?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{deleteTarget?.name}&quot;. This action cannot be undone.
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
    </ProtectedShell>
  )
}

function PackFormDialog({ open, initialPack, isEdit, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [tasks, setTasks] = useState([{ name: '', weight: 1 }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && initialPack) {
      setName(initialPack.name)
      setTasks(initialPack.tasks)
      setError('')
    }
  }, [open, initialPack])

  function handleTaskChange(index, field, value) {
    const newTasks = [...tasks]
    newTasks[index][field] = value
    setTasks(newTasks)
  }

  function addTask() {
    setTasks([...tasks, { name: '', weight: 1 }])
  }

  function removeTask(index) {
    const newTasks = tasks.filter((_, i) => i !== index)
    setTasks(newTasks.length ? newTasks : [{ name: '', weight: 1 }])
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
        weight: Number(t.weight),
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit pack' : 'Create pack'}</DialogTitle>
          <DialogDescription>
            Define tasks and weights. Apply packs from any daily view.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="pack-name">Pack name</Label>
            <Input
              id="pack-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label>Tasks</Label>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_100px_auto] gap-2 items-center"
                >
                  <Input
                    placeholder="Task name"
                    value={task.name}
                    onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                    required={index === 0}
                  />
                  <Input
                    type="number"
                    placeholder="Weight"
                    min="-100"
                    max="100"
                    step="0.01"
                    value={task.weight}
                    onChange={(e) => handleTaskChange(index, 'weight', e.target.value)}
                    required={index === 0}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeTask(index)}
                    aria-label="Remove task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={addTask}>
              + Add task
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save pack'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
