import { memo } from 'react'
import { Flame, Play, Square, Trash2, Zap } from 'lucide-react'
import { formatDuration } from '../utils/helpers'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { playTimerStart, playTimerStop } from '@/utils/soundEffects'

function getWeightBadge(weight) {
  const w = Number(weight)
  if (w >= 2.0) {
    return {
      label: `${w}x Deep Focus`,
      className: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20',
    }
  }
  if (w >= 1.5) {
    return {
      label: `${w}x High Multiplier`,
      className: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
    }
  }
  if (w > 1.0) {
    return {
      label: `${w}x Multiplier`,
      className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    }
  }
  if (w === 1.0) {
    return {
      label: '1.0x Standard',
      className: 'bg-secondary text-muted-foreground border-border/80',
    }
  }
  return {
    label: `${w}x Light`,
    className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  }
}

function TaskCard({
  task,
  elapsedSeconds,
  isActive,
  isSubmitting,
  canStartTimers,
  onStart,
  onStop,
  onDelete,
}) {
  const points = ((elapsedSeconds / 3600) * Number(task.weight) * 5).toFixed(1)
  const weightBadge = getWeightBadge(task.weight)

  function handleStart() {
    playTimerStart()
    onStart()
  }

  function handleStop() {
    playTimerStop()
    onStop()
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover',
        isActive
          ? 'border-sky-500/60 bg-gradient-to-b from-sky-500/5 via-card to-card shadow-lg ring-2 ring-sky-500/20'
          : 'border-border/80 hover:border-border',
      )}
    >
      {/* Top Header: Task Name, Multiplier Badge, Delete */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
              </span>
            )}
            <h3 className="truncate text-base font-bold tracking-tight text-foreground" title={task.name}>
              {task.name}
            </h3>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold',
                weightBadge.className,
              )}
            >
              <Zap className="h-3 w-3" />
              {weightBadge.label}
            </span>

            {elapsedSeconds > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5 text-xs font-medium text-foreground font-mono-numbers">
                <Flame className="h-3 w-3 text-amber-500" />
                +{points} pts
              </span>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground/60 opacity-60 transition-opacity hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          disabled={isSubmitting}
          aria-label={`Remove ${task.name}`}
          title="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Middle/Bottom: Timer readout & Action Buttons */}
      <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Time Tracked
          </span>
          <span
            className={cn(
              'font-mono-numbers text-xl font-bold tracking-tight',
              isActive ? 'text-primary' : 'text-foreground',
            )}
          >
            {formatDuration(elapsedSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isActive ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5 font-semibold shadow-sm"
              onClick={handleStop}
              disabled={isSubmitting}
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="gap-1.5 font-semibold shadow-sm bg-primary hover:bg-primary/90"
              onClick={handleStart}
              disabled={!canStartTimers || isSubmitting}
              title={!canStartTimers ? 'Timers can only be run on today' : 'Start focus timer'}
            >
              <Play className="h-4 w-4 fill-current" />
              Start
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(TaskCard)
