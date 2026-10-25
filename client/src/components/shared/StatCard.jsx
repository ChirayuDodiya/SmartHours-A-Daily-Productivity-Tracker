import { cn } from '@/lib/utils'

export default function StatCard({
  label,
  value,
  subvalue,
  icon: Icon,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-card transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          {children ?? (
            <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono-numbers">
              {value}
            </p>
          )}
          {subvalue && (
            <p className="mt-1 text-xs text-muted-foreground">{subvalue}</p>
          )}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  )
}
