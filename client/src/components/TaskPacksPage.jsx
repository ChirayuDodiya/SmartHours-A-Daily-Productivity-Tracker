import { useState, useEffect } from 'react'
import ProtectedShell from './ProtectedShell'
import { apiRequest } from '../utils/helpers'

export default function TaskPacksPage({ user, onLogout }) {
  const [packs, setPacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formState, setFormState] = useState({ isOpen: false, isEdit: false, pack: null })

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

  async function handleDelete(packId) {
    if (!window.confirm('Are you sure you want to delete this pack?')) {
      return
    }

    try {
      await apiRequest(`/api/v1/packs/${packId}`, { method: 'DELETE' })
      setPacks((prev) => prev.filter((p) => p.id !== packId))
    } catch (err) {
      alert(`Could not delete pack: ${err.message}`)
    }
  }

  function openCreateForm() {
    setFormState({
      isOpen: true,
      isEdit: false,
      pack: { name: '', tasks: [{ name: '', weight: 1 }] }
    })
  }

  function openEditForm(pack) {
    setFormState({
      isOpen: true,
      isEdit: true,
      pack: {
        id: pack.id,
        name: pack.name,
        tasks: pack.tasks.length ? pack.tasks.map(t => ({ id: t.id, name: t.name, weight: t.weight })) : [{ name: '', weight: 1 }]
      }
    })
  }

  function closeForm() {
    setFormState({ isOpen: false, isEdit: false, pack: null })
  }

  return (
    <ProtectedShell user={user} onLogout={onLogout}>
      <section className="calendar-shell" aria-labelledby="packs-title">
        <div className="calendar-heading">
          <div>
            <p className="eyebrow">Settings</p>
            <h1 id="packs-title">Task Packs</h1>
          </div>
          <button type="button" className="primary-action" style={{ width: 'auto', padding: '0 24px', minHeight: '40px', marginTop: 0 }} onClick={openCreateForm}>
            Create Pack
          </button>
        </div>

        {error && (
          <p className="form-status error" style={{ marginBottom: '20px' }}>
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="empty-state">Loading packs...</p>
        ) : packs.length === 0 && !formState.isOpen ? (
          <p className="empty-state">No task packs found. Create one to get started.</p>
        ) : !formState.isOpen ? (
          <div className="packs-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {packs.map((pack) => (
              <div key={pack.id} className="task-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0 }}>{pack.name}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="secondary-action" style={{ minHeight: '32px', padding: '0 12px' }} onClick={() => openEditForm(pack)}>Edit</button>
                    <button type="button" className="secondary-action stop-action" style={{ minHeight: '32px', padding: '0 12px' }} onClick={() => handleDelete(pack.id)}>Delete</button>
                  </div>
                </div>
                <div style={{ color: 'var(--text)', fontSize: '14px' }}>
                  {pack.tasks.length} task{pack.tasks.length !== 1 ? 's' : ''}
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-h)', fontSize: '14px', width: '100%' }}>
                  {pack.tasks.slice(0, 3).map((task) => (
                    <li key={task.id || task.name}>{task.name} ({task.weight})</li>
                  ))}
                  {pack.tasks.length > 3 && (
                    <li>...and {pack.tasks.length - 3} more</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        {formState.isOpen && (
          <PackForm 
            initialPack={formState.pack} 
            isEdit={formState.isEdit} 
            onClose={closeForm} 
            onSuccess={() => {
              closeForm()
              fetchPacks()
            }} 
          />
        )}
      </section>
    </ProtectedShell>
  )
}

function PackForm({ initialPack, isEdit, onClose, onSuccess }) {
  const [name, setName] = useState(initialPack.name)
  const [tasks, setTasks] = useState(initialPack.tasks)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
    if (newTasks.length === 0) {
      newTasks.push({ name: '', weight: 1 })
    }
    setTasks(newTasks)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validTasks = tasks.filter(t => t.name.trim() !== '')
    if (validTasks.length === 0) {
      setError('At least one task with a name is required')
      return
    }

    const payload = {
      name: name.trim(),
      tasks: validTasks.map(t => ({
        ...(t.id ? { id: t.id } : {}),
        name: t.name.trim(),
        weight: Number(t.weight)
      }))
    }

    try {
      setIsSubmitting(true)
      if (isEdit) {
        await apiRequest(`/api/v1/packs/${initialPack.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      } else {
        await apiRequest('/api/v1/packs', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      }
      onSuccess()
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="task-form">
      <h2>{isEdit ? 'Edit Pack' : 'Create Pack'}</h2>
      {error && <p className="form-status error">{error}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <label>
          Pack Name
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            maxLength={255}
          />
        </label>

        <div>
          <label style={{ marginBottom: '8px' }}>Tasks</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            {tasks.map((task, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 100px auto', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Task Name"
                  value={task.name}
                  onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                  required={index === 0}
                />
                <input
                  type="number"
                  placeholder="Weight"
                  min="-100"
                  max="100"
                  step="0.01"
                  value={task.weight}
                  onChange={(e) => handleTaskChange(index, 'weight', e.target.value)}
                  required={index === 0}
                />
                <button 
                  type="button" 
                  className="secondary-action" 
                  style={{ minHeight: '40px', padding: '0 12px', borderColor: 'var(--border)' }}
                  onClick={() => removeTask(index)}
                  title="Remove task"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button 
            type="button" 
            className="secondary-action" 
            style={{ marginTop: '12px', width: '100%' }}
            onClick={addTask}
          >
            + Add Task
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button type="submit" className="primary-action" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Pack'}
          </button>
          <button type="button" className="secondary-action" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
