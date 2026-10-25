import {
  BarChart3,
  CalendarDays,
  Clock,
  Package,
  X,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRoutePath, navigateTo } from '@/utils/helpers'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Calendar & Focus',
    icon: CalendarDays,
    match: (p) => p === '/' || /^\/day\//.test(p),
  },
  {
    path: '/analytics',
    label: 'Insights & Trends',
    icon: BarChart3,
    match: (p) => p === '/analytics',
  },
  {
    path: '/packs',
    label: 'Task Templates',
    icon: Package,
    match: (p) => p === '/packs',
  },
]

function NavigationItems({ routePath, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1.5 p-3.5" aria-label="Main navigation">
      {NAV_ITEMS.map(({ path, label, icon: Icon, match }) => {
        const isActive = match(routePath)
        return (
          <button
            key={path}
            type="button"
            onClick={() => {
              navigateTo(path)
              onNavigate?.()
            }}
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-150',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
              )}
              aria-hidden="true"
            />
            <span>{label}</span>
            {isActive && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/90" />
            )}
          </button>
        )
      })}
    </nav>
  )
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const routePath = getRoutePath()

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Close menu overlay"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/70 bg-card/95 backdrop-blur-md shadow-2xl transition-transform duration-200 ease-out lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border/70 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground">
              SmartHours
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              Precision Focus Studio
            </span>
          </div>
          {onMobileClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto lg:hidden"
              onClick={onMobileClose}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <NavigationItems routePath={routePath} onNavigate={onMobileClose} />

        <div className="p-4 border-t border-border/70">
          <div className="rounded-xl border border-border/60 bg-secondary/50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Flow Multipliers</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              High-weight tasks amplify your points. Aim for 40+ daily points to hit the flow streak.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
