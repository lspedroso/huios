import { useState } from 'react'

export default function LoginForm() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [message, setMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setMessage(
      mode === 'login'
        ? 'Login enviado. Conecte este formulário ao seu backend.'
        : 'Inscrição enviada. Conecte este formulário ao seu backend.',
    )
  }

  return (
    <div className="auth-panel">
      <h2 id="login-title" className="section-title">
        {mode === 'login' ? 'Login' : 'Inscrição'}
      </h2>
      <p className="section-text">
        {mode === 'login'
          ? 'Acesse sua conta para acompanhar sua inscrição.'
          : 'Preencha os dados para se inscrever no HUIÓS.'}
      </p>

      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          className={mode === 'login' ? 'is-active' : ''}
          onClick={() => {
            setMode('login')
            setMessage('')
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

        <button className="cta auth-submit" type="submit">
          {mode === 'login' ? 'Entrar' : 'Confirmar inscrição'}
        </button>
      </form>

      {message && <p className="auth-message">{message}</p>}
    </div>
  )
}
