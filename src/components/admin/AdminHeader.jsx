import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminHeader() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A'

  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        <div className="admin-brand">
          <Link to="/" className="admin-logo" title="Voltar ao início">
            HUIÓS
          </Link>
          <span className="admin-brand-divider" aria-hidden="true" />
          <span className="admin-tag">Admin</span>
        </div>

        <div className="admin-user-info">
          {user?.email && (
            <div className="admin-user-pill" title={`Conectado como ${user.email}`}>
              <span className="admin-user-avatar">{userInitial}</span>
              <span className="admin-user-email">{user.email}</span>
            </div>
          )}

          <div className="admin-nav-actions">
            <Link
              to="/"
              className="admin-btn-ghost"
              title="Acessar site público"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Site</span>
            </Link>

            <button
              type="button"
              className="admin-btn-ghost logout"
              onClick={handleLogout}
              title="Encerrar sessão de administrador"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
