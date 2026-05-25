import {
  BarChart3,
  CalendarDays,
  Clock,
  Package,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRoutePath, navigateTo } from '@/utils/helpers'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { path: '/', label: 'Calendar', icon: CalendarDays, match: (p) => p === '/' || /^\/day\//.test(p) },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, match: (p) => p === '/analytics' },
  { path: '/packs', label: 'Task Packs', icon: Package, match: (p) => p === '/packs' },
]

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const routePath = getRoutePath()

  function NavContent({ onNavigate }) {
    return (
      <>
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-base font-semibold text-foreground">SmartHours</span>
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

        <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
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
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </button>
            )
          })}
        </nav>
      </>
    )
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-label="Close menu overlay"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col border-r border-border bg-card shadow-card transition-transform duration-200 ease-out lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <NavContent onNavigate={onMobileClose} />
      </aside>
    </>
  )
}
