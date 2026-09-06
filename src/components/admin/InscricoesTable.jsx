import { useState, useMemo } from 'react'

export default function InscricoesTable({
  inscricoes = [],
  loading = false,
  onSelectInscricao,
  onConfirmInscricao
}) {
  const [filtroStatus, setFiltroStatus] = useState('todas') // 'todas' | 'pendente' | 'confirmada'
  const [busca, setBusca] = useState('')

  // Filtragem combinada por status e termo de busca (nome, e-mail ou telefone)
  const inscricoesFiltradas = useMemo(() => {
    return inscricoes.filter((item) => {
      const matchStatus =
        filtroStatus === 'todas' ? true : item.status === filtroStatus

      const termo = busca.toLowerCase().trim()
      const matchBusca =
        !termo ||
        item.nome?.toLowerCase().includes(termo) ||
        item.email?.toLowerCase().includes(termo) ||
        item.telefone?.includes(termo)

      return matchStatus && matchBusca
    })
  }, [inscricoes, filtroStatus, busca])

  const formatarData = (dataIso) => {
    if (!dataIso) return '-'
    try {
      const d = new Date(dataIso)
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).replace('.', '')
    } catch {
      return dataIso
    }
  }

  const getIniciais = (nome) => {
    if (!nome) return '?'
    const partes = nome.trim().split(' ').filter(Boolean)
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  const contagens = useMemo(() => {
    return {
      todas: inscricoes.length,
      pendentes: inscricoes.filter((i) => i.status === 'pendente').length,
      confirmadas: inscricoes.filter((i) => i.status === 'confirmada').length
    }
  }, [inscricoes])

  return (
    <div className="admin-table-section">
      {/* Barra de Controles: Filtros Segmentados e Busca */}
      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Filtrar inscrições por status">
          <button
            type="button"
            className={`admin-tab ${filtroStatus === 'todas' ? 'is-active' : ''}`}
            onClick={() => setFiltroStatus('todas')}
          >
            <span>Todas</span>
            <span className="admin-tab-count">{contagens.todas}</span>
          </button>
          <button
            type="button"
            className={`admin-tab ${filtroStatus === 'pendente' ? 'is-active' : ''}`}
            onClick={() => setFiltroStatus('pendente')}
          >
            <span>Pendentes</span>
            <span className="admin-tab-count">{contagens.pendentes}</span>
          </button>
          <button
            type="button"
            className={`admin-tab ${filtroStatus === 'confirmada' ? 'is-active' : ''}`}
            onClick={() => setFiltroStatus('confirmada')}
          >
            <span>Confirmadas</span>
            <span className="admin-tab-count">{contagens.confirmadas}</span>
          </button>
        </div>

        <div className="admin-search-wrapper">
          <span className="admin-search-icon" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Buscar por nome, e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setBusca('')}
              title="Limpar busca"
              aria-label="Limpar busca"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Inscrições */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading-state">
            <div className="admin-spinner" />
            <p>Carregando dados das inscrições...</p>
          </div>
        ) : inscricoesFiltradas.length === 0 ? (
          <div className="admin-empty-state">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <h3>Nenhum participante encontrado</h3>
            <p>
              {busca
                ? 'Nenhum resultado corresponde à sua pesquisa. Tente outro termo.'
                : filtroStatus !== 'todas'
                ? `Não há inscrições com o status "${filtroStatus}".`
                : 'Ainda não há inscrições registradas no banco de dados.'}
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Participante</th>
                    <th>Contato</th>
                    <th>Retiro</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {inscricoesFiltradas.map((item) => {
                    const isPendente = item.status === 'pendente'

                    return (
                      <tr key={item.id}>
                        {/* Participante com Avatar */}
                        <td>
                          <div className="admin-participant-cell">
                            <div className="admin-avatar" aria-hidden="true">
                              {getIniciais(item.nome)}
                            </div>
                            <div className="admin-participant-info">
                              <span className="admin-participant-name">{item.nome}</span>
                              <span className="admin-participant-meta">
                                {item.idade ? `${item.idade} anos` : 'Idade ñ informada'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* E-mail e Telefone */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>
                              {item.email}
                            </span>
                            <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                              {item.telefone || '-'}
                            </span>
                          </div>
                        </td>

                        {/* Retiro */}
                        <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                          {item.retiro || 'Retiro Huíos'}
                        </td>

                        {/* Data */}
                        <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                          {formatarData(item.created_at)}
                        </td>

                        {/* Status Badge */}
                        <td>
                          <span
                            className={`admin-status-badge ${
                              isPendente ? 'pendente' : 'confirmada'
                            }`}
                          >
                            <span className="status-dot" />
                            {isPendente ? 'Pendente' : 'Confirmada'}
                          </span>
                        </td>

                        {/* Ações */}
                        <td>
                          <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="admin-btn-action"
                              onClick={() => onSelectInscricao(item)}
                              title="Ver detalhes completos"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>Ver</span>
                            </button>

                            {isPendente && (
                              <button
                                type="button"
                                className="admin-btn-action confirm"
                                onClick={() => onConfirmInscricao(item)}
                                title="Confirmar pagamento e vaga"
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Confirmar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-table-footer">
              <span>
                Exibindo <strong>{inscricoesFiltradas.length}</strong> de{' '}
                <strong>{inscricoes.length}</strong> inscrições
              </span>

              {(busca || filtroStatus !== 'todas') && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca('')
                    setFiltroStatus('todas')
                  }}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: 'var(--orange)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
