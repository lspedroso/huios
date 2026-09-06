import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function LoginForm({ onSuccess, redirectOnSuccess }) {
  const navigate = useNavigate()
  const { user, signIn, signUp, signInWithGoogle, signOut, isConfigured, isAdmin, adminLoading } = useAuth()

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleResendConfirmation = async () => {
    if (!form.email) {
      setMessage('Informe seu e-mail no campo acima para reenviar o link.')
      setIsError(true)
      return
    }

    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: form.email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/inscricao`
        }
      })

      if (error) {
        setMessage('Não foi possível reenviar o link agora. Tente em instantes.')
        setIsError(true)
      } else {
        setMessage(`Link de confirmação reenviado para ${form.email}! Verifique sua caixa de entrada e Spam.`)
        setIsError(false)
      }
    } catch {
      setMessage('Falha ao reenviar e-mail de confirmação. Verifique sua conexão.')
      setIsError(true)
    } finally {
      setResending(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setMessage('')
    setIsError(false)
    setLoading(true)

    if (!isConfigured) {
      setLoading(false)
      setIsError(true)
      setMessage('A integração com o Supabase ainda não foi configurada no arquivo .env.')
      return
    }

    const targetRedirect = redirectOnSuccess || '/inscricao'
    const result = await signInWithGoogle(targetRedirect)

    if (!result.success) {
      setLoading(false)
      setIsError(true)
      setMessage(result.error)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setIsError(false)
    setLoading(true)

    if (!isConfigured) {
      setLoading(false)
      setIsError(true)
      setMessage('A integração com o Supabase ainda não foi configurada no arquivo .env.')
      return
    }

    if (mode === 'login') {
      const result = await signIn(form.email, form.password)
      setLoading(false)

      if (!result.success) {
        setIsError(true)
        setMessage(result.error)
        return
      }

      setMessage('Login realizado com sucesso!')
      if (onSuccess) {
        onSuccess(result.user)
      } else if (redirectOnSuccess) {
        navigate(redirectOnSuccess)
      }
    } else {
      const result = await signUp(form.email, form.password, form.name)
      setLoading(false)

      if (!result.success) {
        setIsError(true)
        setMessage(result.error)
        return
      }

      // Atualiza o rascunho temporário com o nome e e-mail cadastrados
      try {
        const salvo = sessionStorage.getItem('huios_inscricao_temp')
        const dados = salvo ? JSON.parse(salvo) : {}
        sessionStorage.setItem('huios_inscricao_temp', JSON.stringify({
          ...dados,
          nome: form.name.trim(),
          salvoPorEmail: form.email.trim()
        }))
      } catch {
        // Ignora falha de armazenamento
      }

      // Supabase pode requerer confirmação de e-mail ou já autenticar direto
      if (result.session) {
        setMessage('Cadastro realizado com sucesso!')
        if (onSuccess) {
          onSuccess(result.user)
        } else if (redirectOnSuccess) {
          navigate(redirectOnSuccess)
        }
      } else {
        setMessage('Cadastro realizado! Se necessário, confirme o e-mail enviado para sua caixa de entrada antes de entrar.')
      }
    }
  }

  // Se o usuário já estiver logado, exibe painel informativo mantendo o design
  if (user) {
    return (
      <div className="auth-panel auth-panel-connected">
        <h2 id="login-title" className="section-title">
          Conta Conectada
        </h2>
        <p className="section-text">
          Você está conectado como <strong>{user.user_metadata?.name || user.email}</strong>.
        </p>

        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.25rem' }}>
          {adminLoading ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', margin: '0.5rem 0' }}>
              Verificando permissões de acesso...
            </p>
          ) : isAdmin ? (
            <button
              className="cta auth-submit"
              type="button"
              onClick={() => navigate('/admin')}
            >
              Acessar Painel Administrativo
            </button>
          ) : (
            redirectOnSuccess && (
              <button
                className="cta auth-submit"
                type="button"
                onClick={() => navigate(redirectOnSuccess)}
              >
                Continuar para Inscrição
              </button>
            )
          )}

          <button
            className="cta auth-submit"
            type="button"
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
              boxShadow: 'none'
            }}
            onClick={signOut}
          >
            Sair da conta
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-panel">
      <h2 id="login-title" className="section-title">
        {mode === 'login' ? 'Login' : 'Cadastro'}
      </h2>
      <p className="section-text">
        {mode === 'login'
          ? 'Acesse sua conta para continuar sua inscrição no HUIÓS.'
          : 'Crie sua conta para prosseguir com a inscrição no HUIÓS.'}
      </p>

      {/* Botão Oficial de Autenticação com Google */}
      <button
        type="button"
        className="btn-google-auth"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Continuar com o Google</span>
      </button>

      <div className="auth-divider">
        <span>ou com e-mail e senha</span>
      </div>

      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          className={mode === 'login' ? 'is-active' : ''}
          onClick={() => {
            setMode('login')
            setMessage('')
            setIsError(false)
          }}
        >
          Entrar
        </button>
        <button
          type="button"
          className={mode === 'signup' ? 'is-active' : ''}
          onClick={() => {
            setMode('signup')
            setMessage('')
            setIsError(false)
          }}
        >
          Cadastre-se
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <label>
            Nome
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Seu nome completo"
              required
            />
          </label>
        )}

        <label>
          E-mail
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="voce@email.com"
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </label>

        <button className="cta auth-submit" type="submit" disabled={loading}>
          {loading
            ? (mode === 'login' ? 'Entrando...' : 'Cadastrando...')
            : (mode === 'login' ? 'Entrar' : 'Criar conta')}
        </button>
      </form>

      {message && (
        <div style={{ marginTop: '0.85rem' }}>
          <p
            className="auth-message"
            style={{ color: isError ? '#ff7875' : 'var(--orange)', margin: 0, lineHeight: 1.5 }}
          >
            {message}
          </p>

          {isError && message.includes('não confirmado') && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resending}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--orange)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '0.5rem',
                padding: 0,
                display: 'inline-block'
              }}
            >
              {resending ? 'Reenviando e-mail...' : 'Reenviar link de confirmação'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
