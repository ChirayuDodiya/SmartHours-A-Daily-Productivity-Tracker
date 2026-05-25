import { cn } from '@/lib/utils'

export default function StatCard({ label, value, className, children }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-primary/15 bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-sm',
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children ?? (
        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
      )}
    </div>
  )
}
