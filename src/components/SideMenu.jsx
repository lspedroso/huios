const links = [
  { id: 'inicio', label: 'Início' },
  { id: 'main', label: 'Inscreva-se' },
  { id: 'main', label: 'Login' },
  { id: 'contato', label: 'Contato' },
]

export default function SideMenu({ open, onNavigate, onClose }) {
  return (
    <aside className={`side-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="side-menu-header">
        <span className="side-brand">HUIÓS</span>
        <button className="side-close" type="button" aria-label="Fechar" onClick={onClose}>
          ×
        </button>
      </div>

      <nav className="side-nav">
        {links.map((link) => (
          <button
            key={`${link.label}-${link.id}`}
            type="button"
            className="side-link"
            onClick={() => onNavigate(link.id)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <p className="side-tagline">Filhos maduros em propósito.</p>
    </aside>
  )
}
