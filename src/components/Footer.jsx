export default function Footer() {
  return (
    <footer className="footer" id="contato">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>HUIÓS</strong>
          <span>Filhos Maduros</span>
        </div>

        <div className="footer-info">
          <a href="tel:+5500000000000" className="footer-link">
            <span className="footer-label">Telefone</span>
            (00) 00000-0000
          </a>
          <a
            href="https://instagram.com/huios_2ipr"
            className="footer-link"
            target="_blank"
            rel="noreferrer"
          >
            <span className="footer-label">Instagram</span>
            @huios_2ipr
          </a>
        </div>
      </div>

      <p className="footer-copy">© {new Date().getFullYear()} HUIÓS. Todos os direitos reservados.</p>
    </footer>
  )
}
