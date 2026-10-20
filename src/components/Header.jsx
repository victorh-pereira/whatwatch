import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar'
import AuthModal from './AuthModal'
import { useAuth } from '../context/AuthContext'

/**
 * Cabeçalho fixo no topo.
 * Fica transparente no topo da home e sólido ao rolar (como a Netflix).
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const { isAuthenticated, user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fecha o menu mobile ao trocar de página
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      navigate('/')
    } catch {
      /* silencioso */
    }
  }, [signOut, navigate])

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors hover:text-ww-text ${
      isActive ? 'text-ww-text' : 'text-ww-muted'
    }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'bg-ww-bg/95 shadow-lg shadow-black/40 backdrop-blur'
          : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="text-2xl font-black tracking-tight">
            <span className="text-ww-red">What</span>
            <span className="text-ww-text">Watch</span>
          </span>
        </Link>

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-5 md:flex">
          <Link to="/" className={navLinkClass}>
            Início
          </Link>
          <Link to="/busca" className={navLinkClass}>
            Buscar
          </Link>
          <Link to="/minha-biblioteca" className={navLinkClass}>
            Minha Biblioteca
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="w-40 sm:w-64">
            <SearchBar />
          </div>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ww-red text-sm font-bold text-white transition hover:bg-ww-red-dark"
                aria-label="Menu do usuário"
              >
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </button>
              {menuOpen && (
                <div className="ww-fade-in absolute right-0 mt-2 w-56 rounded-lg border border-ww-border bg-ww-surface p-2 shadow-2xl">
                  <p className="truncate px-3 py-2 text-xs text-ww-muted">
                    {user?.email}
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-ww-text transition hover:bg-ww-surface-2"
                  >
                    Sair da conta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-md bg-ww-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-ww-red-dark"
            >
              Entrar
            </button>
          )}

          {/* Hambúrguer mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 text-ww-text md:hidden"
            aria-label="Abrir menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <nav className="ww-fade-in border-t border-ww-border bg-ww-bg/98 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" className={navLinkClass}>
              Início
            </Link>
            <Link to="/busca" className={navLinkClass}>
              Buscar
            </Link>
            <Link to="/minha-biblioteca" className={navLinkClass}>
              Minha Biblioteca
            </Link>
          </div>
        </nav>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  )
}
