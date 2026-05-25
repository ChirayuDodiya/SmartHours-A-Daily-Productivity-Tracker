import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from './EmptyState'
import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHART_HEIGHT } from '../charts/chartTheme'

export default function ChartPanel({
  title,
  description,
  isLoading,
  error,
  isEmpty,
  emptyTitle = 'No data available',
  emptyDescription,
  children,
  className,
}) {
  return (
    <Card className={cn('mt-8 overflow-hidden', className)}>
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="relative min-h-[280px] sm:min-h-[320px]">
          {isLoading && (
            <ChartSkeleton />
          )}
          {!isLoading && error && (
            <p className="py-16 text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {!isLoading && !error && isEmpty && (
            <EmptyState
              icon={BarChart3}
              title={emptyTitle}
              description={emptyDescription}
              className="border-none bg-transparent py-10"
            />
          )}
          {!isLoading && !error && !isEmpty && children}
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-6"
      style={{ minHeight: CHART_HEIGHT.pie }}
      aria-hidden="true"
    >
      <Skeleton className="h-44 w-44 rounded-full" />
      <div className="flex flex-wrap justify-center gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  )
}
