import { Loader2 } from 'lucide-react'
import heroImg from '../assets/hero.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

export default function AuthPage({
  copy,
  email,
  password,
  status,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleAuth,
  onSwitchMode,
}) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between"
        aria-label="SmartHours overview"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(9, 33, 58, 0.55), rgba(9, 33, 58, 0.75)), url(${heroImg})`,
          }}
        />
        <div className="relative z-10 p-8">
          <span className="text-lg font-bold text-white">SmartHours</span>
        </div>
        <div className="relative z-10 flex flex-1 items-center justify-center p-8">
          <img
            src={heroImg}
            alt=""
            className="max-h-64 w-auto drop-shadow-2xl"
            aria-hidden="true"
          />
        </div>
        <Card className="relative z-10 m-8 border-white/20 bg-white/10 text-white backdrop-blur-md">
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-white/80">Today&apos;s score</span>
            <strong className="text-2xl font-bold">42 pts</strong>
          </CardContent>
        </Card>
      </section>

      <section
        className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16"
        aria-labelledby="auth-title"
      >
        <p className="mb-6 text-lg font-bold text-primary lg:hidden">SmartHours</p>
        <div className="mx-auto w-full max-w-md animate-in-slide">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {copy.eyebrow}
          </p>
          <h1 id="auth-title" className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {copy.title}
          </h1>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={onEmailChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={copy.submit === 'Create account' ? 'new-password' : 'current-password'}
                value={password}
                onChange={onPasswordChange}
                placeholder="Minimum 8 characters"
                minLength={copy.submit === 'Create account' ? 8 : undefined}
                required
              />
            </div>

            {status.message && (
              <Alert variant={status.type === 'error' ? 'destructive' : 'success'}>
                <AlertDescription role="status">{status.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Please wait…
                </>
              ) : (
                copy.submit
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={onGoogleAuth}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#db4437] text-xs font-bold text-white">
              G
            </span>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {copy.switchPrompt}{' '}
            <button
              type="button"
              onClick={onSwitchMode}
              className="font-semibold text-primary hover:underline"
            >
              {copy.switchAction}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
