import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchMulti, img, formatYear, resolveMediaType } from '../lib/tmdb'
import { useDetailModal } from '../context/DetailModalContext'

/**
 * Busca dinâmica com sugestões em tempo real (debounce de 300ms).
 * Enter leva para a página de busca completa com filtros.
 */
export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef(null)
  const navigate = useNavigate()
  const { openDetails } = useDetailModal()

  // Debounce: busca quando o usuário para de digitar
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await searchMulti(query.trim())
        setSuggestions(
          (data.results ?? []).filter((r) => r.media_type !== 'person').slice(0, 6)
        )
        setOpen(true)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    navigate(`/busca?q=${encodeURIComponent(query.trim())}`)
  }

  const pickSuggestion = (item) => {
    setOpen(false)
    setQuery('')
    openDetails(resolveMediaType(item), item.id)
  }

  return (
    <div ref={boxRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ww-muted"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder="Buscar títulos..."
          className="w-full rounded-full border border-ww-border bg-ww-surface/80 py-2 pl-9 pr-3 text-sm text-ww-text placeholder-ww-muted outline-none transition focus:border-ww-red focus:bg-ww-surface"
          aria-label="Buscar filmes e séries"
        />
      </form>

      {open && (suggestions.length > 0 || loading) && (
        <div className="ww-fade-in absolute mt-2 w-80 overflow-hidden rounded-lg border border-ww-border bg-ww-surface shadow-2xl sm:w-96">
          {loading && (
            <p className="px-4 py-3 text-sm text-ww-muted">Buscando...</p>
          )}
          {!loading &&
            suggestions.map((item) => {
              const title = item.title || item.name
              const year = formatYear(item.release_date || item.first_air_date)
              return (
                <button
                  key={`${resolveMediaType(item)}-${item.id}`}
                  onClick={() => pickSuggestion(item)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-ww-surface-2"
                >
                  {item.poster_path ? (
                    <img
                      src={img.poster(item.poster_path, 'w92')}
                      alt=""
                      className="h-14 w-10 shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-14 w-10 shrink-0 rounded bg-ww-surface-2" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ww-text">
                      {title}{' '}
                      {year && <span className="text-ww-muted">({year})</span>}
                    </p>
                    <p className="text-xs text-ww-muted">
                      {item.media_type === 'movie' ? 'Filme' : 'Série'}
                    </p>
                  </div>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
