import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import Hero from './components/Hero'
import SideMenu from './components/SideMenu'
import MainSection from './components/MainSection'
import Footer from './components/Footer'
import Inscricao from './components/Inscricao'
import LoginPage from './components/LoginPage'
import Admin from './pages/Admin'
import AdminRoute from './components/AdminRoute'

function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navigate = useNavigate()

  const handleMenuNavigate = (id) => {
    setMenuOpen(false)

    if (id === 'inscricao') {
      navigate('/inscricao')
      return
    }

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
        onNavigate={handleMenuNavigate}
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
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/inscricao" element={<Inscricao />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}