import { memo } from 'react'
import { Play, Square, Trash2 } from 'lucide-react'
import { formatDuration } from '../utils/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
  return (
    <Card
      className={cn(
        'transition-card shadow-card hover:shadow-card-hover',
        isActive && 'border-primary/40 shadow-card-hover ring-1 ring-primary/25',
      )}
    >
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="truncate text-base font-medium text-foreground">{task.name}</h3>
          <Badge variant="secondary" className="font-normal">
            Weight {task.weight}
          </Badge>
        </div>

        <p
          className={cn(
            'font-mono text-xl font-semibold tabular-nums text-foreground sm:min-w-[7rem] sm:text-right',
            isActive && 'text-primary',
          )}
          aria-label="Elapsed time"
        >
          {formatDuration(elapsedSeconds)}
        </p>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button
            type="button"
            size="sm"
            onClick={onStart}
            disabled={!canStartTimers || isSubmitting || isActive}
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onStop}
            disabled={isSubmitting || !isActive}
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onDelete}
            disabled={isSubmitting}
            aria-label={`Remove ${task.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(TaskCard)
