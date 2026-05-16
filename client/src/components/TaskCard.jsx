import { Play, Square, Trash2 } from 'lucide-react'
import { formatDuration } from '../utils/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
    <Card
      className={cn(
        'transition-shadow',
        isActive && 'border-primary shadow-md ring-1 ring-primary/20',
      )}
    >
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">{task.name}</h3>
          <Badge variant="secondary" className="mt-2">
            Weight {task.weight}
          </Badge>
        </div>

        <p
          className="font-mono text-lg font-semibold tabular-nums text-foreground sm:text-right"
          aria-label="Elapsed time"
        >
          {formatDuration(elapsedSeconds)}
        </p>

        <div className="flex flex-wrap gap-2">
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
