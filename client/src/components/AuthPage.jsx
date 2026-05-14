import heroImg from '../assets/hero.png'

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
    <main className="auth-shell">
      <section className="auth-visual" aria-label="SmartHours overview">
        <div className="brand-mark">SmartHours</div>
        <img src={heroImg} alt="Abstract productivity illustration" className="hero-art" />
        <div className="score-strip" aria-hidden="true">
          <span>Today</span>
          <strong>42 pts</strong>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="auth-title">{copy.title}</h1>

        <form className="auth-form" onSubmit={onSubmit}>
          <label htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={onEmailChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              autoComplete={copy.submit === 'Create account' ? 'new-password' : 'current-password'}
              value={password}
              onChange={onPasswordChange}
              placeholder="Minimum 8 characters"
              minLength={copy.submit === 'Create account' ? 8 : undefined}
              required
            />
          </label>

          {status.message && (
            <p className={`form-status ${status.type}`} role="status">
              {status.message}
            </p>
          )}

          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : copy.submit}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button className="google-action" type="button" onClick={onGoogleAuth}>
          <span aria-hidden="true">G</span>
          Continue with Google
        </button>

        <p className="mode-switch">
          {copy.switchPrompt}{' '}
          <button type="button" onClick={onSwitchMode}>
            {copy.switchAction}
          </button>
        </p>
      </section>
    </main>
  )
}
