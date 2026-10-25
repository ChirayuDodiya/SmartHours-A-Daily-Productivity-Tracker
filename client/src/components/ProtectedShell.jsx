import AppLayout from './layout/AppLayout'

export default function ProtectedShell({
  user,
  onLogout,
  activeSession,
  onStopActiveTimer,
  children,
}) {
  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
      activeSession={activeSession}
      onStopActiveTimer={onStopActiveTimer}
    >
      {children}
    </AppLayout>
  )
}
