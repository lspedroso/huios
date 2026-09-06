export default function ConfirmModal({ inscricao, onClose, onConfirm, confirming = false }) {
  if (!inscricao) return null

  return (
    <div
      className="admin-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="admin-modal-card"
        style={{ maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '0.75rem' }}>
          <h2 className="admin-modal-title" style={{ fontSize: '1.2rem' }}>
            Confirmar Inscrição
          </h2>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            disabled={confirming}
            aria-label="Fechar"
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

        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0.5rem 0 1.5rem' }}>
          Deseja confirmar a vaga de <strong style={{ color: 'var(--text)' }}>{inscricao.nome}</strong>?
          <br />
          O status da inscrição será alterado para <span style={{ color: '#34d399', fontWeight: 600 }}>Confirmada</span>.
        </p>

        <div className="admin-modal-footer">
          <button
            type="button"
            className="admin-btn-action"
            onClick={onClose}
            disabled={confirming}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="admin-btn-action confirm"
            style={{ padding: '0.45rem 1rem' }}
            disabled={confirming}
            onClick={() => onConfirm(inscricao.id)}
          >
            {confirming ? 'Confirmando...' : 'Confirmar Vaga'}
          </button>
        </div>
      </div>
    </div>
  )
}
