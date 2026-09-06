export default function AdminDashboard({ total = 0, pendentes = 0, confirmadas = 0 }) {
  const percentConfirmadas = total > 0 ? Math.round((confirmadas / total) * 100) : 0
  const percentPendentes = total > 0 ? Math.round((pendentes / total) * 100) : 0

  return (
    <section className="admin-metrics-grid" aria-label="Métricas do Retiro">
      {/* Total */}
      <div className="admin-metric-card total">
        <div className="admin-metric-header">
          <span className="admin-metric-label">Total de Inscrições</span>
          <span className="admin-metric-indicator" aria-hidden="true" />
        </div>
        <div className="admin-metric-body">
          <span className="admin-metric-value">{total}</span>
          <span className="admin-metric-subtext">registros ativos</span>
        </div>
      </div>

      {/* Pendentes */}
      <div className="admin-metric-card pendente">
        <div className="admin-metric-header">
          <span className="admin-metric-label">Inscrições Pendentes</span>
          <span className="admin-metric-indicator" aria-hidden="true" />
        </div>
        <div className="admin-metric-body">
          <span className="admin-metric-value">{pendentes}</span>
          <span className="admin-metric-subtext">
            {total > 0 ? `${percentPendentes}% do total` : 'nenhuma pendente'}
          </span>
        </div>
      </div>

      {/* Confirmadas */}
      <div className="admin-metric-card confirmada">
        <div className="admin-metric-header">
          <span className="admin-metric-label">Inscrições Confirmadas</span>
          <span className="admin-metric-indicator" aria-hidden="true" />
        </div>
        <div className="admin-metric-body">
          <span className="admin-metric-value">{confirmadas}</span>
          <span className="admin-metric-subtext">
            {total > 0 ? `${percentConfirmadas}% confirmadas` : 'aguardando'}
          </span>
        </div>
      </div>
    </section>
  )
}
