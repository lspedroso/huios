import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'

import Hero from './components/Hero'
import SideMenu from './components/SideMenu'
import MainSection from './components/MainSection'
import Footer from './components/Footer'
import Inscricao from './components/Inscricao'

function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navigate = useNavigate()

  const scrollTo = (id) => {
    setMenuOpen(false)

    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth'
    })
  }

  return (
    <div className="app">

      <button
        className={`hamburger ${menuOpen ? 'is-open' : ''}`}
        type="button"
        aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <SideMenu
        open={menuOpen}
        onNavigate={scrollTo}
        onClose={() => setMenuOpen(false)}
      />

      {menuOpen && (
        <button
          className="menu-backdrop"
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <Hero
        onInscribe={() => navigate('/inscricao')}
      />

      <MainSection />

      <Footer />

    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/inscricao"
        element={<Inscricao />}
      />
    </Routes>
  )
}