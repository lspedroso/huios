import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  INSCRICAO_TEMP_KEY,
  getWhatsAppLink,
  HUIOS_WHATSAPP_MESSAGE_PAGAMENTO,
  HUIOS_WHATSAPP_MESSAGE_PENDENTE,
  HUIOS_WHATSAPP_MESSAGE_CONFIRMADA
} from '../config/constants'

export default function Inscricao() {
  const navigate = useNavigate()
  const { user, loading: authLoading, signOut } = useAuth()

  const [formulario, setFormulario] = useState({
    nome: '',
    telefone: '',
    dataNascimento: '',
    responsavelNome: '',
    responsavelTelefone: '',
    batizado: '',
    igreja: '',
    membroIgreja: ''
  })

  const [enviado, setEnviado] = useState(false)
  const [inscricaoExistente, setInscricaoExistente] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')

  // 1. Recupera dados temporários salvos anteriormente
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(INSCRICAO_TEMP_KEY)
      if (salvo) {
        const dados = JSON.parse(salvo)

        // Se houver usuário logado e o rascunho salvo pertencer a outro e-mail, descarta o rascunho
        if (user && dados.salvoPorEmail && dados.salvoPorEmail !== user.email) {
          sessionStorage.removeItem(INSCRICAO_TEMP_KEY)
          return
        }

        const nomeUsuario = user?.user_metadata?.name || user?.user_metadata?.full_name || ''

        setFormulario((anterior) => ({
          ...anterior,
          ...dados,
          // Se o usuário logado possui um nome cadastrado na conta, prioriza o nome oficial da conta
          nome: nomeUsuario || dados.nome || anterior.nome || '',
          dataNascimento: dados.dataNascimento || dados.data_nascimento || '',
          responsavelNome: dados.responsavelNome || dados.responsavel_nome || '',
          responsavelTelefone: dados.responsavelTelefone || dados.responsavel_telefone || ''
        }))
      }
    } catch {
      // Ignora erro de parse de cache corrompido
    }
  }, [user])

  // 2. Preenche nome do usuário logado e consulta inscrição existente
  useEffect(() => {
    if (user) {
      const nomeUsuario = user.user_metadata?.name || user.user_metadata?.full_name || ''
      if (nomeUsuario) {
        setFormulario((anterior) => ({
          ...anterior,
          nome: nomeUsuario
        }))
      }

      // Verifica se o usuário já possui inscrição no banco de dados pelo user_id
      if (isSupabaseConfigured) {
        supabase
          .from('inscricoes')
          .select('id, status, retiro, nome, created_at')
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (!error && data) {
              setInscricaoExistente(data)
            } else if (!data) {
              setInscricaoExistente(null)
            }
          })
          .catch(() => {
            // Não bloqueia o formulário em caso de falha transitória de consulta inicial
          })
      }
    } else {
      setInscricaoExistente(null)
    }
  }, [user])

  const handleTrocarConta = async () => {
    try {
      sessionStorage.removeItem(INSCRICAO_TEMP_KEY)
    } catch {}
    setFormulario({
      nome: '',
      telefone: '',
      dataNascimento: '',
      responsavelNome: '',
      responsavelTelefone: '',
      batizado: '',
      igreja: '',
      membroIgreja: ''
    })
    setInscricaoExistente(null)
    await signOut()
    navigate('/login?redirect=/inscricao')
  }

  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return null
    const partes = dataNasc.split('-')
    if (partes.length !== 3) return null
    const ano = parseInt(partes[0], 10)
    const mes = parseInt(partes[1], 10) - 1
    const dia = parseInt(partes[2], 10)

    const hoje = new Date()
    const nasc = new Date(ano, mes, dia)
    if (isNaN(nasc.getTime())) return null

    let idade = hoje.getFullYear() - nasc.getFullYear()
    const m = hoje.getMonth() - nasc.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--
    }
    return idade >= 0 ? idade : null
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }

  const formatarTelefone = (value) => {
    const raw = (value || '').replace(/\D/g, '').slice(0, 11)
    let formatted = raw

    if (raw.length > 2 && raw.length <= 6) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`
    } else if (raw.length > 6 && raw.length <= 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`
    } else if (raw.length > 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
    } else if (raw.length > 0) {
      formatted = raw.length === 2 ? `(${raw}) ` : `(${raw}`
    }
    return formatted
  }

  const handleTelefoneChange = (event) => {
    setFormulario((anterior) => ({
      ...anterior,
      telefone: formatarTelefone(event.target.value)
    }))
  }

  const handleResponsavelTelefoneChange = (event) => {
    setFormulario((anterior) => ({
      ...anterior,
      responsavelTelefone: formatarTelefone(event.target.value)
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMensagemErro('')

    // Se o usuário NÃO estiver logado:
    // Salva os dados no sessionStorage e direciona para o Login/Cadastro
    if (!user) {
      try {
        sessionStorage.setItem(INSCRICAO_TEMP_KEY, JSON.stringify({
          ...formulario,
          salvoPorEmail: null
        }))
      } catch {
        // Armazenamento local
      }
      navigate('/login?redirect=/inscricao')
      return
    }

    // Se o usuário ESTIVER logado:
    if (!isSupabaseConfigured) {
      setMensagemErro('O Supabase ainda não foi configurado. Por favor, adicione as variáveis no arquivo .env.')
      return
    }

    setSalvando(true)

    try {
      // 1. Verifica no banco se já existe inscrição vinculada ao ID único do usuário autenticado
      const { data: existente, error: erroConsulta } = await supabase
        .from('inscricoes')
        .select('id, status, retiro, created_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (erroConsulta) {
        setSalvando(false)
        setMensagemErro('Não foi possível verificar seus dados no servidor. Verifique sua conexão e tente novamente.')
        return
      }

      // Se já possui inscrição: atualiza o estado para exibir a tela de aviso correspondente
      if (existente) {
        setSalvando(false)
        sessionStorage.removeItem(INSCRICAO_TEMP_KEY)
        setInscricaoExistente(existente)
        return
      }

      // 2. Salva a inscrição no Supabase vinculada ao user_id e email autenticado
      // Utiliza exclusivamente as colunas reais da tabela public.inscricoes
      const idadeCalculada = calcularIdade(formulario.dataNascimento)
      const isMenorDeIdade = idadeCalculada !== null && idadeCalculada < 18

      const payload = {
        user_id: user.id,
        email: user.email,
        nome: formulario.nome.trim(),
        telefone: formulario.telefone.trim(),
        data_nascimento: formulario.dataNascimento,
        batizado: formulario.batizado === 'sim',
        igreja: formulario.membroIgreja === 'sim' ? (formulario.igreja.trim() || null) : null,
        retiro: 'Retiro Huíos',
        status: 'pendente',
        responsavel_nome: isMenorDeIdade ? (formulario.responsavelNome?.trim() || null) : null,
        responsavel_telefone: isMenorDeIdade ? (formulario.responsavelTelefone?.trim() || null) : null
      }

      const { error: erroInsercao } = await supabase
        .from('inscricoes')
        .insert([payload])

      setSalvando(false)

      if (erroInsercao) {
        // Código 23505 = violação de chave única (já existe inscrição)
        if (erroInsercao.code === '23505' || erroInsercao.message?.includes('duplicate key') || erroInsercao.message?.includes('unique')) {
          sessionStorage.removeItem(INSCRICAO_TEMP_KEY)
          const { data: rec } = await supabase
            .from('inscricoes')
            .select('id, status, retiro, created_at')
            .eq('user_id', user.id)
            .maybeSingle()
          setInscricaoExistente(rec || { status: 'pendente' })
          return
        }

        setMensagemErro('Não foi possível salvar sua inscrição no momento. Tente novamente em instantes.')
        return
      }

      // Sucesso: remove o rascunho temporário e exibe tela de pagamento
      sessionStorage.removeItem(INSCRICAO_TEMP_KEY)
      setEnviado(true)
    } catch {
      setSalvando(false)
      setMensagemErro('Erro de conexão ao salvar sua inscrição. Verifique sua internet e tente novamente.')
    }
  }

  const botaoVoltar = (
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
  )

  // 1. TELA SE O USUÁRIO JÁ POSSUI INSCRIÇÃO (CONFIRMADA / ACEITA OU PENDENTE)
  if (inscricaoExistente) {
    const isConfirmada = inscricaoExistente.status === 'confirmada'
    const zapMsg = isConfirmada ? HUIOS_WHATSAPP_MESSAGE_CONFIRMADA : HUIOS_WHATSAPP_MESSAGE_PENDENTE

    return (
      <main className="inscricao-page">
        {botaoVoltar}

        <section className={`status-card ${isConfirmada ? 'is-confirmada' : 'is-pendente'}`}>
          <div className="status-icon-wrapper" aria-hidden="true">
            {isConfirmada ? (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            )}
          </div>

          <div className="status-chip">
            <span className="status-chip-dot" />
            {isConfirmada ? 'Inscrição Confirmada' : 'Inscrição em Análise'}
          </div>

          <h1 className="status-title">
            {isConfirmada ? 'Você já está confirmado!' : 'Inscrição já cadastrada!'}
          </h1>

          <p className="status-description">
            {isConfirmada
              ? 'Sua vaga no Retiro Huíos está 100% confirmada e garantida pela equipe! Prepare o seu coração para dias transformadores.'
              : 'Identificamos que você já possui uma inscrição pendente vinculada a esta conta. Para validar sua vaga, conclua as orientações via WhatsApp.'}
          </p>

          <div className="status-ticket">
            <div className="status-ticket-header">
              <span className="status-ticket-title">{inscricaoExistente.retiro || 'Retiro Huíos'}</span>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.25rem 0.7rem',
                  borderRadius: '999px',
                  background: isConfirmada ? 'rgba(82, 196, 26, 0.15)' : 'rgba(242, 110, 34, 0.15)',
                  border: isConfirmada ? '1px solid rgba(82, 196, 26, 0.4)' : '1px solid var(--line)',
                  color: isConfirmada ? '#73d13d' : 'var(--orange)'
                }}
              >
                {isConfirmada ? 'Vaga Garantida' : 'Aguardando Pagamento'}
              </span>
            </div>

            {user && (
              <div className="status-ticket-row">
                <span className="status-ticket-label">Participante</span>
                <span className="status-ticket-value">
                  {inscricaoExistente?.nome || user.user_metadata?.name || user.user_metadata?.full_name || formulario.nome || user.email}
                </span>
              </div>
            )}

            <div className="status-info-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                {isConfirmada
                  ? 'Fique atento ao WhatsApp oficial. Próximo à data do retiro compartilharemos o cronograma completo, lista de bagagem e orientações gerais.'
                  : 'O pagamento é tratado diretamente com a equipe do Huíos via WhatsApp. Após a confirmação, sua vaga será ativada.'}
              </span>
            </div>
          </div>

          <a
            href={getWhatsAppLink(undefined, zapMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="status-cta-whatsapp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{isConfirmada ? 'Falar no WhatsApp' : 'Continuar pelo WhatsApp'}</span>
          </a>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}>
            <Link to="/" className="status-btn-voltar" style={{ margin: 0 }}>
              Voltar para a página inicial
            </Link>
            <button
              type="button"
              onClick={handleTrocarConta}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Entrar ou cadastrar com outra conta
            </button>
          </div>
        </section>
      </main>
    )
  }

  // 2. TELA DE SUCESSO APÓS GRAVAÇÃO ("QUASE LÁ!")
  if (enviado) {
    return (
      <main className="inscricao-page">
        {botaoVoltar}
        <section className="status-card is-pendente">
          <div className="status-icon-wrapper" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <div className="status-chip">
            <span className="status-chip-dot" />
            Inscrição Realizada
          </div>

          <h1 className="status-title">Quase lá!</h1>

          <p className="status-description">
            Sua inscrição foi recebida com sucesso! Agora basta tratar o pagamento com a equipe para garantir sua vaga definitiva.
          </p>

          <div className="status-ticket">
            <div className="status-ticket-header">
              <span className="status-ticket-title">Retiro Huíos</span>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.25rem 0.7rem',
                  borderRadius: '999px',
                  background: 'rgba(242, 110, 34, 0.15)',
                  border: '1px solid var(--line)',
                  color: 'var(--orange)'
                }}
              >
                Aguardando Pagamento
              </span>
            </div>

            {formulario.nome && (
              <div className="status-ticket-row">
                <span className="status-ticket-label">Participante</span>
                <span className="status-ticket-value">{formulario.nome}</span>
              </div>
            )}

            <div className="status-info-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                O pagamento é tratado diretamente com os organizadores do Huíos via WhatsApp. Assim que o pagamento for confirmado, sua vaga estará 100% garantida.
              </span>
            </div>
          </div>

          <a
            href={getWhatsAppLink(undefined, HUIOS_WHATSAPP_MESSAGE_PAGAMENTO)}
            target="_blank"
            rel="noopener noreferrer"
            className="status-cta-whatsapp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Continuar pelo WhatsApp</span>
          </a>

          <Link to="/" className="status-btn-voltar">
            Voltar para a página inicial
          </Link>
        </section>
      </main>
    )
  }

  // 3. TELA DO FORMULÁRIO DE INSCRIÇÃO
  return (
    <main className="inscricao-page">
      {botaoVoltar}

      <section className="inscricao-card">

        <span className="inscricao-label">
          RETIRO HUIÓS
        </span>

        <h1>Faça sua inscrição</h1>

        <p className="inscricao-description">
          Preencha seus dados para participar do retiro.
        </p>

        {user ? (
          <div className="inscricao-account-badge">
            <div className="inscricao-account-info">
              <span className="inscricao-account-label">Conta conectada</span>
              <span className="inscricao-account-email" title={user.email}>
                <strong>{user.user_metadata?.name || user.user_metadata?.full_name || user.email}</strong>
                {(user.user_metadata?.name || user.user_metadata?.full_name) && (
                  <span className="inscricao-account-sub"> ({user.email})</span>
                )}
              </span>
            </div>
            <button
              type="button"
              className="inscricao-btn-switch"
              onClick={handleTrocarConta}
              title="Trocar de conta para cadastrar com outro e-mail"
            >
              Trocar conta
            </button>
          </div>
        ) : null}

        {mensagemErro && (
          <div
            style={{
              background: 'rgba(255, 77, 79, 0.12)',
              border: '1px solid rgba(255, 77, 79, 0.35)',
              borderRadius: '0.75rem',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              color: '#ff7875',
              fontSize: '0.9rem',
              lineHeight: 1.4
            }}
          >
            {mensagemErro}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="nome">
              Nome completo
            </label>

            <input
              id="nome"
              name="nome"
              type="text"
              placeholder="Digite seu nome"
              value={formulario.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefone">
              Telefone / WhatsApp
            </label>

            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>

              <input
                id="telefone"
                name="telefone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formulario.telefone}
                onChange={handleTelefoneChange}
                maxLength={15}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dataNascimento">
              Data de nascimento
            </label>

            <input
              id="dataNascimento"
              name="dataNascimento"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={formulario.dataNascimento}
              onChange={handleChange}
              required
            />
          </div>

          {calcularIdade(formulario.dataNascimento) !== null &&
            calcularIdade(formulario.dataNascimento) < 18 && (
              <>
                <div className="form-group">
                  <label htmlFor="responsavelNome">
                    Nome do responsável
                  </label>

                  <input
                    id="responsavelNome"
                    name="responsavelNome"
                    type="text"
                    placeholder="Nome completo do responsável"
                    value={formulario.responsavelNome}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="responsavelTelefone">
                    Telefone do responsável
                  </label>

                  <div className="input-with-icon">
                    <span className="input-icon" aria-hidden="true">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>

                    <input
                      id="responsavelTelefone"
                      name="responsavelTelefone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formulario.responsavelTelefone}
                      onChange={handleResponsavelTelefoneChange}
                      maxLength={15}
                      required
                    />
                  </div>
                </div>
              </>
            )}

          <div className="form-group">
            <label>
              Você é batizado?
            </label>

            <div className="radio-group">

              <label className="radio-option">
                <input
                  type="radio"
                  name="batizado"
                  value="sim"
                  checked={formulario.batizado === 'sim'}
                  onChange={handleChange}
                  required
                />

                <span>Sim</span>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="batizado"
                  value="nao"
                  checked={formulario.batizado === 'nao'}
                  onChange={handleChange}
                />

                <span>Não</span>
              </label>

            </div>
          </div>

          <div className="form-group">
            <label>
              Você é membro de alguma igreja?
            </label>

            <div className="radio-group">

              <label className="radio-option">
                <input
                  type="radio"
                  name="membroIgreja"
                  value="sim"
                  checked={formulario.membroIgreja === 'sim'}
                  onChange={handleChange}
                  required
                />

                <span>Sim</span>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="membroIgreja"
                  value="nao"
                  checked={formulario.membroIgreja === 'nao'}
                  onChange={handleChange}
                />

                <span>Não</span>
              </label>

            </div>
          </div>

          {formulario.membroIgreja === 'sim' && (
            <div className="form-group">

              <label htmlFor="igreja">
                De qual igreja você é?
              </label>

              <input
                id="igreja"
                name="igreja"
                type="text"
                placeholder="Digite o nome da sua igreja"
                value={formulario.igreja}
                onChange={handleChange}
                required
              />

            </div>
          )}

          <button
            className="cta inscricao-button"
            type="submit"
            disabled={salvando || authLoading}
          >
            {salvando ? 'Salvando inscrição...' : 'Continuar'}
          </button>

        </form>

      </section>

    </main>
  )
}