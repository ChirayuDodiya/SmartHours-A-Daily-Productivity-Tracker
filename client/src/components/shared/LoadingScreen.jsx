import { Clock, Loader2 } from 'lucide-react'

export default function LoadingScreen({ message = 'Initializing your focus studio…' }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background animate-in-fade">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/25">
        <Clock className="h-7 w-7 animate-pulse" aria-hidden="true" />
      </div>
      <div className="text-center">
        <p className="text-base font-bold text-foreground">SmartHours</p>
        <p className="mt-1 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          {message}
        </p>
      </div>
    </main>
  )
}
