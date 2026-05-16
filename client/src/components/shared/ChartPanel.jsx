import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from './EmptyState'
import { BarChart3 } from 'lucide-react'

export default function ChartPanel({
  title,
  description,
  isLoading,
  error,
  isEmpty,
  emptyTitle = 'No data available',
  emptyDescription,
  children,
}) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[320px]">
          {isLoading && (
            <div className="flex h-[320px] flex-col items-center justify-center gap-3">
              <Skeleton className="h-48 w-full max-w-md" />
              <Skeleton className="h-4 w-32" />
            </div>
          )}
          {!isLoading && error && (
            <p className="py-12 text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {!isLoading && !error && isEmpty && (
            <EmptyState
              icon={BarChart3}
              title={emptyTitle}
              description={emptyDescription}
              className="border-none bg-transparent"
            />
          )}
          {!isLoading && !error && !isEmpty && children}
        </div>
      </CardContent>
    </Card>
  )
}
