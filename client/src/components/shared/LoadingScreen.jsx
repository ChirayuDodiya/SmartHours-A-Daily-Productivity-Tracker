import { Loader2 } from 'lucide-react'

export default function LoadingScreen({ message = 'Loading your workspace…' }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background animate-in-fade">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">SmartHours</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  )
}
