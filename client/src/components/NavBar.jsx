import { navigateTo } from '../utils/helpers'

export default function NavBar({ userEmail, onLogout }) {
  return (
    <nav className="app-nav">
      <strong style={{ cursor: 'pointer' }} onClick={() => navigateTo('/')}>SmartHours</strong>
      <div className="nav-actions">
        <button type="button" className="secondary-action" style={{ border: 'none', background: 'transparent' }} onClick={() => navigateTo('/analytics')}>
          Analytics
        </button>
        <button type="button" className="secondary-action" style={{ border: 'none', background: 'transparent' }} onClick={() => navigateTo('/packs')}>
          Packs
        </button>
        <span>{userEmail}</span>
        <button type="button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </nav>
  )
}
