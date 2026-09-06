export default function InscricaoModal({ inscricao, onClose, onConfirm }) {
  if (!inscricao) return null

  const isPendente = inscricao.status === 'pendente'

  const formatarData = (dataIso) => {
    if (!dataIso) return '-'
    try {
      const d = new Date(dataIso)
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dataIso
    }
  }

  const formatarDataNascimento = (dataIso, idade) => {
    if (dataIso) {
      try {
        const partes = dataIso.split('-')
        if (partes.length === 3) {
          const ano = parseInt(partes[0], 10)
          const mes = parseInt(partes[1], 10)
          const dia = parseInt(partes[2], 10)

          let anos = idade
          if (anos === null || anos === undefined) {
            const nasc = new Date(ano, mes - 1, dia)
            const hoje = new Date()
            if (!isNaN(nasc.getTime())) {
              anos = hoje.getFullYear() - nasc.getFullYear()
              const m = hoje.getMonth() - nasc.getMonth()
              if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
                anos--
              }
            }
          }

          const diaStr = String(dia).padStart(2, '0')
          const mesStr = String(mes).padStart(2, '0')
          const idadeTexto = anos !== null && anos !== undefined && anos >= 0 ? ` (${anos} anos)` : ''
          return `${diaStr}/${mesStr}/${ano}${idadeTexto}`
        }
      } catch {
        // Fallback em caso de erro de parsing
      }
      return dataIso
    }
    if (idade) {
      return `${idade} anos`
    }
    return 'Não informada'
  }

  return (
    <div
      className="admin-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="admin-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div>
            <h2 id="modal-title" className="admin-modal-title">
              Detalhes da Inscrição
            </h2>
            <p className="admin-modal-subtitle">
              Registrado em {formatarData(inscricao.created_at)}
            </p>
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Fechar modal de detalhes"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="admin-detail-grid">
          <div className="admin-detail-item">
            <span className="admin-detail-label">Nome Completo</span>
            <span className="admin-detail-value">{inscricao.nome}</span>
          </div>

          <div className="admin-detail-item">
            <span className="admin-detail-label">Status da Inscrição</span>
            <span
              className={`admin-status-badge ${
                isPendente ? 'pendente' : 'confirmada'
              }`}
              style={{ width: 'fit-content' }}
            >
              <span className="status-dot" />
              {isPendente ? 'Pendente' : 'Confirmada'}
            </span>
          </div>

          <div className="admin-detail-item">
            <span className="admin-detail-label">E-mail</span>
            <span className="admin-detail-value">{inscricao.email}</span>
          </div>

          <div className="admin-detail-item">
            <span className="admin-detail-label">Telefone / WhatsApp</span>
            <span className="admin-detail-value">{inscricao.telefone || 'Não informado'}</span>
          </div>

          <div className="admin-detail-item">
            <span className="admin-detail-label">Data de Nascimento</span>
            <span className="admin-detail-value">
              {formatarDataNascimento(inscricao.data_nascimento, inscricao.idade)}
            </span>
          </div>

          <div className="admin-detail-item">
            <span className="admin-detail-label">Retiro</span>
            <span className="admin-detail-value">{inscricao.retiro || 'Retiro Huíos'}</span>
          </div>

          <div className="admin-detail-item">
            <span className="admin-detail-label">É Batizado(a)?</span>
            <span className="admin-detail-value">
              {inscricao.batizado === true || inscricao.batizado === 'sim' ? 'Sim' : 'Não'}
            </span>
          </div>

          <div className="admin-detail-item">
            <span className="admin-detail-label">Membro de Igreja?</span>
            <span className="admin-detail-value">
              {inscricao.igreja
                ? `Sim (${inscricao.igreja})`
                : (inscricao.membro_igreja === 'sim' ? `Sim (${inscricao.igreja || 'Não informada'})` : 'Não')}
            </span>
          </div>

          {inscricao.responsavel_nome && (
            <div className="admin-detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="admin-detail-label">Responsável Legal</span>
              <span className="admin-detail-value">
                {inscricao.responsavel_nome} {inscricao.responsavel_telefone ? `• ${inscricao.responsavel_telefone}` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="admin-user-id-box">
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
            ID do Usuário Supabase
          </span>
          <code style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'monospace' }}>
            {inscricao.user_id}
          </code>
        </div>

        <div className="admin-modal-footer">
          <button
            type="button"
            className="admin-btn-action"
            onClick={onClose}
          >
            Fechar
          </button>

          {isPendente && (
            <button
              type="button"
              className="admin-btn-action confirm"
              style={{ padding: '0.45rem 1rem' }}
              onClick={() => {
                onClose()
                onConfirm(inscricao)
              }}
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
              <span>Confirmar Inscrição</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
