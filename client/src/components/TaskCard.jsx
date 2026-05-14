import { formatDuration } from '../utils/helpers'

export default function TaskCard({
  task,
  elapsedSeconds,
  isActive,
  isSubmitting,
  canStartTimers,
  onStart,
  onStop,
  onDelete,
}) {
  return (
    <article className={`task-card${isActive ? ' active' : ''}`}>
      <div className="task-card-main">
        <h3>{task.name}</h3>
        <span className="weight-badge">Weight {task.weight}</span>
      </div>

      <div className="timer-display" aria-label="Elapsed time">
        {formatDuration(elapsedSeconds)}
      </div>

      <div className="timer-actions">
        <button
          className="start-action"
          type="button"
          onClick={onStart}
          disabled={!canStartTimers || isSubmitting || isActive}
        >
          Start
        </button>

        <button
          className="stop-action"
          type="button"
          onClick={onStop}
          disabled={isSubmitting || !isActive}
        >
          Stop
        </button>

        <button
          className="remove-action"
          type="button"
          onClick={onDelete}
          aria-label={`Remove ${task.name}`}
        >
          Remove
        </button>
      </div>
    </article>
  )
}
