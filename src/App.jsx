import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { DetailModalProvider } from './context/DetailModalContext'
import { LibraryProvider } from './context/LibraryContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Search from './pages/Search'
import MyList from './pages/MyList'

/** Rola para o topo ao trocar de página */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LibraryProvider>
          <DetailModalProvider>
            <ScrollToTop />
            <div className="flex min-h-screen flex-col bg-ww-bg text-ww-text">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/busca" element={<Search />} />
                  <Route path="/minha-biblioteca" element={<MyList />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </DetailModalProvider>
        </LibraryProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
