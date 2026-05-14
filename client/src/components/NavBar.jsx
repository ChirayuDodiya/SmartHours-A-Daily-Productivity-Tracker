export default function NavBar({ userEmail, onLogout }) {
  return (
    <nav className="app-nav">
      <strong>SmartHours</strong>
      <div className="nav-actions">
        <span>{userEmail}</span>
        <button type="button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </nav>
  )
}
