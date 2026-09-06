import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

import AdminHeader from '../components/admin/AdminHeader'
import AdminDashboard from '../components/admin/AdminDashboard'
import InscricoesTable from '../components/admin/InscricoesTable'
import InscricaoModal from '../components/admin/InscricaoModal'
import ConfirmModal from '../components/admin/ConfirmModal'
import '../components/admin/admin.css'

export default function Admin() {
  const navigate = useNavigate()
  const { user, loading, isAdmin, adminLoading, signOut } = useAuth()

  const [inscricoes, setInscricoes] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [erro, setErro] = useState('')

  // Modais
  const [inscricaoSelecionada, setInscricaoSelecionada] = useState(null)
  const [inscricaoParaConfirmar, setInscricaoParaConfirmar] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  // Notificação Toast
  const [toast, setToast] = useState(null)

  const showToast = (mensagem, tipo = 'sucesso') => {
    setToast({ mensagem, tipo })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Busca lista de inscrições do Supabase
  const carregarInscricoes = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setErro('Supabase não configurado. Adicione as variáveis de ambiente no arquivo .env.')
      setLoadingData(false)
      return
    }

    setLoadingData(true)
    setErro('')

    try {
      const { data, error } = await supabase
        .from('inscricoes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setErro('Não foi possível carregar as inscrições. Verifique suas permissões de administrador.')
        setInscricoes([])
      } else {
        setInscricoes(data || [])
      }
    } catch {
      setErro('Erro de conexão com o banco de dados. Tente recarregar a página.')
      setInscricoes([])
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && !adminLoading && user && isAdmin) {
      carregarInscricoes()
    }
  }, [loading, adminLoading, user, isAdmin, carregarInscricoes])

  // Redireciona usuários não autorizados para o login
  useEffect(() => {
    if (!loading && !adminLoading && !isAdmin) {
      navigate('/login?redirect=/admin')
    }
  }, [loading, adminLoading, isAdmin, navigate])

  // Confirmação de inscrição pendente -> confirmada
  const handleConfirmarStatus = async (id) => {
    setConfirmando(true)

    try {
      const { error } = await supabase
        .from('inscricoes')
        .update({ status: 'confirmada' })
        .eq('id', id)

      if (error) {
        showToast('Erro ao confirmar inscrição no servidor.', 'erro')
      } else {
        // Atualiza a interface imediatamente
        setInscricoes((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'confirmada' } : item
          )
        )
        setInscricaoParaConfirmar(null)
        showToast('Inscrição confirmada com sucesso!')
      }
    } catch {
      showToast('Falha na comunicação com o banco de dados.', 'erro')
    } finally {
      setConfirmando(false)
    }
  }

  // Métricas calculadas em tempo real dos dados do banco
  const metrics = useMemo(() => {
    const total = inscricoes.length
    const pendentes = inscricoes.filter((i) => i.status === 'pendente').length
    const confirmadas = inscricoes.filter((i) => i.status === 'confirmada').length
    return { total, pendentes, confirmadas }
  }, [inscricoes])

  // 1. ESTADO DE CARREGAMENTO INICIAL
  if (loading || adminLoading) {
    return (
      <div className="admin-denied-container">
        <div style={{ textAlign: 'center' }}>
          <div className="admin-spinner" style={{ margin: '0 auto 1.25rem' }} />
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Verificando permissões de acesso...</p>
        </div>
      </div>
    )
  }

  // 2. SE O USUÁRIO NÃO ESTIVER AUTENTICADO -> RETORNA NULL ENQUANTO REDIRECIONA
  if (!user) {
    return null
  }

  // 3. SE O USUÁRIO ESTIVER AUTENTICADO, MAS NÃO FOR ADMINISTRADOR (role !== 'adm') -> ACESSO RESTRITO
  if (!isAdmin) {
    return (
      <div className="admin-denied-container">
        <div className="admin-denied-card">
          <div className="admin-denied-icon" aria-hidden="true">
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <span
            style={{
              color: 'var(--orange)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em'
            }}
          >
            Área Restrita
          </span>

          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text)' }}>
            Acesso Não Autorizado
          </h1>

          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0.25rem 0' }}>
            A conta <strong>{user.email}</strong> não possui permissões administrativas para acessar esta área.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.75rem', marginTop: '1rem' }}>
            <Link
              to="/"
              className="cta auth-submit"
              style={{ textAlign: 'center', textDecoration: 'none' }}
            >
              Voltar ao Início
            </Link>

            <button
              type="button"
              className="cta auth-submit"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--muted)',
                boxShadow: 'none'
              }}
              onClick={async () => {
                await signOut()
                navigate('/login?redirect=/admin')
              }}
            >
              Entrar com outra conta
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 4. PAINEL ADMINISTRATIVO (USUÁRIO É ADM AUTORIZADO)
  return (
    <div className="admin-layout">
      <AdminHeader />

      <main className="admin-container">
        {/* Cabeçalho da Página com Título e Indicador de Sincronização */}
        <div className="admin-page-header">
          <div className="admin-page-title-group">
            <h1>Inscrições</h1>
            <p>Gerencie em tempo real as inscrições e participantes do Retiro Huíos.</p>
          </div>

          <div className="admin-header-status">
            <div className="admin-live-badge">
              <span className="admin-live-dot" />
              <span>Ao vivo</span>
            </div>

            <button
              type="button"
              className={`admin-btn-refresh ${loadingData ? 'is-spinning' : ''}`}
              onClick={carregarInscricoes}
              disabled={loadingData}
              title="Atualizar inscrições"
              aria-label="Atualizar inscrições"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
          </div>
        </div>

        {erro ? (
          <div className="admin-error-state" style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <h3>Erro ao carregar dados</h3>
            <p>{erro}</p>
            <button
              type="button"
              className="admin-btn-action"
              onClick={carregarInscricoes}
              style={{ marginTop: '0.5rem' }}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <AdminDashboard
              total={metrics.total}
              pendentes={metrics.pendentes}
              confirmadas={metrics.confirmadas}
            />

            <InscricoesTable
              inscricoes={inscricoes}
              loading={loadingData}
              onSelectInscricao={(item) => setInscricaoSelecionada(item)}
              onConfirmInscricao={(item) => setInscricaoParaConfirmar(item)}
            />
          </>
        )}
      </main>

      {/* Modal de Detalhes */}
      <InscricaoModal
        inscricao={inscricaoSelecionada}
        onClose={() => setInscricaoSelecionada(null)}
        onConfirm={(item) => setInscricaoParaConfirmar(item)}
      />

      {/* Modal de Confirmação de Status */}
      <ConfirmModal
        inscricao={inscricaoParaConfirmar}
        confirming={confirmando}
        onClose={() => setInscricaoParaConfirmar(null)}
        onConfirm={handleConfirmarStatus}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className="admin-toast"
          style={{
            borderColor: toast.tipo === 'erro' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(52, 211, 153, 0.4)'
          }}
        >
          <span
            style={{
              color: toast.tipo === 'erro' ? '#f87171' : '#34d399',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {toast.tipo === 'erro' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            )}
          </span>
          <span>{toast.mensagem}</span>
        </div>
      )}
    </div>
  )
}
