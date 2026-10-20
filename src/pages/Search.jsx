import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchByFilters, getGenreList, getYearOptions } from '../lib/tmdb'
import MediaCard from '../components/MediaCard'

/**
 * Página de busca e exploração com filtros combináveis:
 * tipo (Tudo / Filmes / Séries), gênero, ano e ordenação.
 * "Carregar mais" para paginação.
 */
export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [mediaType, setMediaType] = useState('all')
  const [genreId, setGenreId] = useState('')
  const [year, setYear] = useState('')
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [genres, setGenres] = useState([])
  const [results, setResults] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const yearOptions = useMemo(() => getYearOptions(), [])

  /* Carrega a lista de gêneros (filmes + séries) uma vez */
  useEffect(() => {
    let cancelled = false
    Promise.allSettled([getGenreList('movie'), getGenreList('tv')])
      .then(([movie, tv]) => {
        if (cancelled) return
        const map = new Map()
        for (const r of [movie, tv]) {
          if (r.status === 'fulfilled') {
            for (const g of r.value.genres ?? []) map.set(g.id, g.name)
          }
        }
        setGenres(
          [...map.entries()]
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  /* Busca quando os filtros ou a query mudam */
  const runSearch = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true)
      setError(null)
      try {
        const data = await searchByFilters({
          query,
          mediaType,
          genreId,
          year,
          sortBy,
          page: pageToLoad,
        })
        const items = (data.results ?? []).filter(
          (r) => r.media_type !== 'person' && (r.poster_path || r.backdrop_path)
        )
        setResults((prev) => (pageToLoad === 1 ? items : [...prev, ...items]))
        setTotalPages(Math.min(data.total_pages ?? 1, 20))
        setPage(pageToLoad)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [query, mediaType, genreId, year, sortBy]
  )

  useEffect(() => {
    runSearch(1)
  }, [runSearch])

  /* Ao trocar o tipo, limpa gênero e ano (gêneros variam entre filme/série) */
  const changeMediaType = (value) => {
    setMediaType(value)
    setGenreId('')
    setYear('')
  }

  const hasFilters = genreId || year || mediaType !== 'all' || sortBy !== 'popularity.desc'

  const clearFilters = () => {
    setMediaType('all')
    setGenreId('')
    setYear('')
    setSortBy('popularity.desc')
  }

  const tabClass = (active) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      active
        ? 'bg-ww-red text-white'
        : 'border border-ww-border bg-ww-surface text-ww-muted hover:text-ww-text'
    }`

  const selectClass =
    'rounded-full border border-ww-border bg-ww-surface px-4 py-2 text-sm text-ww-text outline-none transition focus:border-ww-red'

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-24 sm:px-6">
      <h1 className="text-2xl font-black sm:text-3xl">
        {query ? (
          <>
            Resultados para <span className="text-ww-red">“{query}”</span>
          </>
        ) : (
          'Explorar'
        )}
      </h1>

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <button onClick={() => changeMediaType('all')} className={tabClass(mediaType === 'all')}>
            Tudo
          </button>
          <button onClick={() => changeMediaType('movie')} className={tabClass(mediaType === 'movie')}>
            Filmes
          </button>
          <button onClick={() => changeMediaType('tv')} className={tabClass(mediaType === 'tv')}>
            Séries
          </button>
        </div>

        {/* Gênero */}
        <select
          value={genreId}
          onChange={(e) => setGenreId(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por gênero"
        >
          <option value="">Todos os gêneros</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Ano */}
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por ano"
        >
          <option value="">Qualquer ano</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Ordenação */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={selectClass}
          aria-label="Ordenar resultados"
        >
          <option value="popularity.desc">Mais populares</option>
          <option value="vote_average.desc">Melhor avaliados</option>
          <option value="primary_release_date.desc">Mais recentes</option>
          <option value="revenue.desc">Maior bilheteria</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto rounded-full border border-ww-border px-4 py-2 text-sm text-ww-muted transition hover:border-ww-red hover:text-ww-text"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Aviso: ordenação só se aplica na exploração sem texto */}
      {query && sortBy !== 'popularity.desc' && (
        <p className="mt-3 text-xs text-ww-muted">
          A ordenação escolhida é aplicada quando você explora sem um texto de busca.
        </p>
      )}

      {/* Erro */}
      {error && (
        <p className="mt-6 rounded-lg border border-ww-red/40 bg-ww-red/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Grade de resultados */}
      <div className="mt-8">
        {loading && results.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="ww-skeleton aspect-[2/3]" />
                <div className="ww-skeleton mt-2 h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-ww-muted">
            {query
              ? 'Nenhum resultado encontrado. Tente ajustar os filtros ou o texto da busca.'
              : 'Escolha um gênero, um ano ou digite algo para explorar o catálogo.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {results.map((item) => (
                <MediaCard key={`${item.media_type ?? mediaType}-${item.id}`} item={item} />
              ))}
            </div>

            {page < totalPages && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => runSearch(page + 1)}
                  disabled={loading}
                  className="rounded-lg border border-ww-border bg-ww-surface px-8 py-3 font-semibold text-ww-text transition hover:border-ww-red disabled:opacity-50"
                >
                  {loading ? 'Carregando...' : 'Carregar mais'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
