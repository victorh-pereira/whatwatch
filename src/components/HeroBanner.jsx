import { useCallback, useEffect, useState } from 'react'
import { getTrending, getDetails, pickTrailer, img, formatYear, formatVote, resolveMediaType } from '../lib/tmdb'
import { useDetailModal } from '../context/DetailModalContext'

/**
 * Banner dinâmico da home: 1 destaque por vez com setas manuais.
 * Mostra título, sinopse, imagem de fundo e botões:
 * - "Assistir trailer" abre o modal já com o player carregado
 * - "Mais informações" abre o modal completo
 */
export default function HeroBanner() {
  const [items, setItems] = useState([])
  const [index, setIndex] = useState(0)
  const [trailerKeys, setTrailerKeys] = useState({})
  const { openDetails } = useDetailModal()

  useEffect(() => {
    let cancelled = false
    getTrending('all', 'week')
      .then((data) => {
        if (!cancelled) setItems((data.results ?? []).slice(0, 6))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Pré-carrega a chave do trailer dos destaques (prioriza PT-BR)
  useEffect(() => {
    if (!items.length) return
    let cancelled = false
    const load = async () => {
      for (const item of items) {
        const type = resolveMediaType(item)
        if (trailerKeys[`${type}-${item.id}`] !== undefined) continue
        try {
          const details = await getDetails(type, item.id)
          const trailer = pickTrailer(details.videos)
          if (!cancelled) {
            setTrailerKeys((prev) => ({
              ...prev,
              [`${type}-${item.id}`]: trailer?.key ?? null,
            }))
          }
        } catch {
          if (!cancelled) {
            setTrailerKeys((prev) => ({ ...prev, [`${type}-${item.id}`]: null }))
          }
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const prev = useCallback(
    () => setIndex((i) => (i === 0 ? items.length - 1 : i - 1)),
    [items.length]
  )
  const next = useCallback(
    () => setIndex((i) => (i + 1) % items.length),
    [items.length]
  )

  // Setas do teclado
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  if (!items.length) {
    return <div className="ww-skeleton h-[70vh] min-h-[480px] w-full rounded-none" />
  }

  const item = items[index]
  const mediaType = resolveMediaType(item)
  const title = item.title || item.name
  const year = formatYear(item.release_date || item.first_air_date)
  const trailerKey = trailerKeys[`${mediaType}-${item.id}`]

  const openWithTrailer = () => openDetails(mediaType, item.id, { autoplay: true })

  return (
    <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
      {/* Imagem de fundo com key para animar a troca */}
      <div key={item.id} className="ww-fade-in absolute inset-0">
        <img
          src={img.backdrop(item.backdrop_path, 'original') || img.poster(item.poster_path, 'w780')}
          alt={title}
          className="h-full w-full object-cover object-top"
        />
        {/* Gradientes: escurece baixo e esquerda para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-ww-bg via-ww-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-ww-bg/95 via-ww-bg/50 to-transparent" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex h-full max-w-[1600px] items-end px-4 pb-20 sm:px-6 sm:pb-24">
        <div key={`${item.id}-text`} className="ww-fade-up max-w-2xl">
          <h1 className="text-3xl font-black leading-tight drop-shadow-lg sm:text-5xl">
            {title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ww-muted">
            {year && <span>{year}</span>}
            <span className="rounded border border-ww-border px-1.5 py-0.5 text-xs">
              {mediaType === 'movie' ? 'Filme' : 'Série'}
            </span>
            {item.vote_average > 0 && (
              <span className="flex items-center gap-1 text-yellow-400">
                ★ {formatVote(item.vote_average)}
              </span>
            )}
          </div>

          <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-ww-text/90 drop-shadow sm:text-base">
            {item.overview || 'Sinopse não disponível.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={openWithTrailer}
              className="flex items-center gap-2 rounded-md bg-ww-text px-6 py-3 text-sm font-bold text-ww-bg transition hover:bg-white disabled:opacity-50"
              disabled={!trailerKey && trailerKey !== null}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Assistir trailer
            </button>
            <button
              onClick={() => openDetails(mediaType, item.id)}
              className="flex items-center gap-2 rounded-md bg-ww-surface/70 px-6 py-3 text-sm font-bold text-ww-text backdrop-blur transition hover:bg-ww-surface-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
              </svg>
              Mais informações
            </button>
          </div>
        </div>
      </div>

      {/* Setas manuais */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Destaque anterior"
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition hover:bg-black/80 focus:opacity-100 sm:opacity-60"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Próximo destaque"
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition hover:bg-black/80 focus:opacity-100 sm:opacity-60"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {items.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setIndex(i)}
                aria-label={`Ir para destaque ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-8 bg-ww-red' : 'w-3 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
