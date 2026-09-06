import { useSearchParams, Link } from 'react-router-dom'
import LoginForm from './LoginForm'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/inscricao'
  const isFromInscricao = redirect.includes('inscricao')

  return (
    <main className="inscricao-page">
      <Link
        to="/"
        className="btn-voltar"
        aria-label="Voltar para a tela de início"
        title="Voltar para o início"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </Link>

      <div style={{ maxWidth: '440px', width: '100%' }}>
        {isFromInscricao && (
          <div
            style={{
              background: 'rgba(242, 110, 34, 0.12)',
              border: '1px solid var(--line)',
              borderRadius: '0.75rem',
              padding: '0.85rem 1.15rem',
              marginBottom: '1rem',
              textAlign: 'center',
              color: 'var(--text)',
              fontSize: '0.9rem'
            }}
          >
            Seus dados foram guardados temporariamente. Faça login ou cadastre-se para continuar sua inscrição.
          </div>
        )}

        <LoginForm redirectOnSuccess={redirect} />
      </div>
    </main>
  )
}
