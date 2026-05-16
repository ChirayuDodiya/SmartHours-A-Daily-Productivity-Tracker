import AppLayout from './layout/AppLayout'

export default function ProtectedShell({ user, onLogout, children }) {
  return (
    <AppLayout user={user} onLogout={onLogout}>
      {children}
    </AppLayout>
  )
}
