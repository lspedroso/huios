import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const navigate = useNavigate()
  const { loading, isAdmin, adminLoading } = useAuth()

  useEffect(() => {
    if (!loading && !adminLoading && !isAdmin) {
      navigate('/login?redirect=/admin')
    }
  }, [loading, adminLoading, isAdmin, navigate])

  if (loading || adminLoading) {
    return (
      <div className="admin-denied-container">
        <div style={{ textAlign: 'center' }}>
          <div className="admin-spinner" style={{ margin: '0 auto 1.25rem' }} />
          <p style={{ color: 'var(--muted)' }}>Verificando permissões de acesso...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return children
}
