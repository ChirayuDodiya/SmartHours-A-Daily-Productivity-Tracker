import NavBar from './NavBar'

export default function ProtectedShell({ user, onLogout, children }) {
  return (
    <main className="protected-shell">
      <NavBar userEmail={user.email} onLogout={onLogout} />
      {children}
    </main>
  )
}
