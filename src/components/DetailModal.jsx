import { useCallback, useEffect, useState } from 'react'
import {
  getDetails,
  pickTrailer,
  getWatchProviders,
  getCertification,
  img,
  formatYear,
  formatRuntime,
  formatVote,
  resolveMediaType,
} from '../lib/tmdb'
import { useLibraryContext } from '../context/LibraryContext'
import { useDetailModal } from '../context/DetailModalContext'
import Stars from './Stars'
import AuthModal from './AuthModal'

/**
 * Modal de detalhes completo:
 * trailer integrado, sinopse, ano, classificação, duração/temporadas,
 * nota, elenco, plataformas de streaming (BR) e títulos semelhantes.
 * Também registra no histórico e permite favoritar/avaliar.
 */
export default function DetailModal({ mediaType, id, autoplay = false, onClose }) {
  const [details, setDetails] = useState(null)
  const [trailer, setTrailer] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [favFeedback, setFavFeedback] = useState(null)

  const {
    isAuthenticated,
    isFavorite,
    toggleFavorite,
    getStars,
    setRating,
    recordView,
    getWatchStatus,
    setWatchStatus,
  } = useLibraryContext()
  // Troca o conteúdo do modal atual ao clicar em um título semelhante
  const { openDetails } = useDetailModal()

  /* ---------------- carregar dados ---------------- */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setDetails(null)
    setPlaying(false)

    getDetails(mediaType, id)
      .then((data) => {
        if (cancelled) return
        setDetails(data)
        const t = pickTrailer(data.videos)
        setTrailer(t)
        // Abre já reproduzindo o trailer quando veio de "Assistir trailer"
        if (autoplay && t?.key) setPlaying(true)

        // Histórico automático ao abrir os detalhes (usuário logado)
        recordView({
          id: data.id,
          media_type: mediaType,
          title: data.title || data.name,
          poster_path: data.poster_path,
          backdrop_path: data.backdrop_path,
          release_date: data.release_date || data.first_air_date,
          vote_average: data.vote_average,
        })
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, id, autoplay])

  /* ---------------- bloqueia scroll ---------------- */
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  /* ---------------- ESC fecha ---------------- */
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /* ---------------- ações ---------------- */
  const handleFavorite = useCallback(async () => {
    if (!details) return
    if (!isAuthenticated) {
      setAuthOpen(true)
      return
    }
    const result = await toggleFavorite({
      id: details.id,
      media_type: mediaType,
      title: details.title || details.name,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      vote_average: details.vote_average,
      release_date: details.release_date || details.first_air_date,
    })
    if (!result?.needsAuth) {
      setFavFeedback(result?.added ? 'Adicionado aos Favoritos ✓' : 'Removido dos Favoritos')
      setTimeout(() => setFavFeedback(null), 2000)
    }
  }, [details, mediaType, isAuthenticated, toggleFavorite])

  const handleRate = useCallback(
    async (stars) => {
      if (!details) return
      if (!isAuthenticated) {
        setAuthOpen(true)
        return
      }
      await setRating(
        {
          id: details.id,
          media_type: mediaType,
          title: details.title || details.name,
          poster_path: details.poster_path,
          vote_average: details.vote_average,
          release_date: details.release_date || details.first_air_date,
        },
        stars
      )
    },
    [details, mediaType, isAuthenticated, setRating]
  )

  /** Quero assistir / Assistido */
  const handleWatch = useCallback(
    async (status) => {
      if (!details) return
      if (!isAuthenticated) {
        setAuthOpen(true)
        return
      }
      await setWatchStatus(
        {
          id: details.id,
          media_type: mediaType,
          title: details.title || details.name,
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path,
          vote_average: details.vote_average,
          release_date: details.release_date || details.first_air_date,
        },
        status
      )
    },
    [details, mediaType, isAuthenticated, setWatchStatus]
  )

  /* ---------------- render ---------------- */
  const title = details?.title || details?.name || ''
  const year = formatYear(details?.release_date || details?.first_air_date)
  const certification = details ? getCertification(mediaType, details) : null
  const runtime = mediaType === 'movie' ? formatRuntime(details?.runtime) : null
  const seasons =
    mediaType === 'tv' && details?.number_of_seasons
      ? `${details.number_of_seasons} temporada${details.number_of_seasons > 1 ? 's' : ''}`
      : null
  const providers = details ? getWatchProviders(details['watch/providers']) : null
  const cast = details?.credits?.cast?.slice(0, 8) ?? []
  const director = details?.credits?.crew?.find((c) => c.job === 'Director')?.name
  const recommendations = details?.recommendations?.results?.slice(0, 10) ?? []
  const currentStars = details ? getStars(details.id, mediaType) : 0
  const favorite = details ? isFavorite(details.id, mediaType) : false
  const watchStatus = details ? getWatchStatus(details.id, mediaType) : null

  return (
    <div
      className="ww-fade-in fixed inset-0 z-[60] overflow-y-auto bg-black/85 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${title}`}
    >
      <div
        className="mx-auto my-6 w-full max-w-4xl overflow-hidden rounded-2xl border border-ww-border bg-ww-surface shadow-2xl sm:my-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- Carregando ---------- */}
        {loading && (
          <div className="p-6 sm:p-10">
            <div className="ww-skeleton aspect-video w-full" />
            <div className="ww-skeleton mt-6 h-8 w-2/3" />
            <div className="ww-skeleton mt-3 h-4 w-full" />
            <div className="ww-skeleton mt-2 h-4 w-5/6" />
          </div>
        )}

        {/* ---------- Erro ---------- */}
        {error && (
          <div className="p-8 text-center">
            <p className="text-lg font-semibold text-ww-text">Ops!</p>
            <p className="mt-2 text-sm text-ww-muted">{error}</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-lg bg-ww-red px-6 py-2.5 font-semibold text-white transition hover:bg-ww-red-dark"
            >
              Fechar
            </button>
          </div>
        )}

        {/* ---------- Conteúdo ---------- */}
        {!loading && details && (
          <>
            {/* Vídeo / Hero do modal */}
            <div className="relative aspect-video w-full bg-black">
              {playing && trailer ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                  title={`Trailer de ${title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  {details.backdrop_path ? (
                    <img
                      src={img.backdrop(details.backdrop_path, 'w1280')}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-ww-surface-2 to-ww-bg" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ww-surface via-transparent to-transparent" />

                  {/* Botão play central */}
                  {trailer && (
                    <button
                      onClick={() => setPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center group"
                      aria-label="Reproduzir trailer"
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ww-red/90 text-white shadow-2xl transition group-hover:scale-110 group-hover:bg-ww-red">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </button>
                  )}
                </>
              )}

              {/* Botão fechar */}
              <button
                onClick={onClose}
                aria-label="Fechar detalhes"
                className="absolute right-3 top-3 z-10 rounded-full bg-black/70 p-2 text-white transition hover:bg-black"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Corpo */}
            <div className="p-5 sm:p-8">
              {/* Título + badges */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black sm:text-3xl">{title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ww-muted">
                    {year && <span>{year}</span>}
                    {certification && (
                      <span className="rounded border border-ww-border px-1.5 py-0.5 text-xs">
                        {certification}
                      </span>
                    )}
                    {runtime && <span>⏱ {runtime}</span>}
                    {seasons && <span>📺 {seasons}</span>}
                    {details.vote_average > 0 && (
                      <span className="flex items-center gap-1 font-semibold text-yellow-400">
                        ★ {formatVote(details.vote_average)}
                        <span className="font-normal text-ww-muted">
                          ({details.vote_count} votos)
                        </span>
                      </span>
                    )}
                  </div>
                  {director && (
                    <p className="mt-1 text-sm text-ww-muted">
                      Direção: <span className="text-ww-text">{director}</span>
                    </p>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleFavorite}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                      favorite
                        ? 'bg-ww-red text-white hover:bg-ww-red-dark'
                        : 'border border-ww-border bg-ww-surface-2 text-ww-text hover:border-ww-red'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" strokeLinejoin="round" />
                    </svg>
                    {favorite ? 'Favorito ✓' : 'Favoritar'}
                  </button>

                  <button
                    onClick={() => handleWatch('want')}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                      watchStatus === 'want'
                        ? 'bg-ww-text text-ww-bg hover:bg-white'
                        : 'border border-ww-border bg-ww-surface-2 text-ww-text hover:border-ww-text'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={watchStatus === 'want' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    {watchStatus === 'want' ? 'Quero assistir ✓' : 'Quero assistir'}
                  </button>

                  <button
                    onClick={() => handleWatch('watched')}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                      watchStatus === 'watched'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'border border-ww-border bg-ww-surface-2 text-ww-text hover:border-green-600'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {watchStatus === 'watched' ? 'Assistido ✓' : 'Assistido'}
                  </button>

                  {favFeedback && (
                    <p className="ww-fade-in text-center text-xs text-green-400">
                      {favFeedback}
                    </p>
                  )}
                </div>
              </div>

              {/* Avaliação do usuário */}
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-ww-border bg-ww-bg/60 p-3">
                <span className="text-sm text-ww-muted">Sua nota:</span>
                <Stars value={currentStars} onChange={handleRate} interactive size={24} />
                {!isAuthenticated ? (
                  <span className="text-xs text-ww-muted">
                    (faça login para avaliar)
                  </span>
                ) : (
                  currentStars > 0 && (
                    <span className="text-xs text-green-400">
                      Avaliado → marcado como assistido
                    </span>
                  )
                )}
              </div>

              {/* Sinopse */}
              <div className="mt-5">
                <h3 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-ww-muted">
                  Sinopse
                </h3>
                <p className="text-sm leading-relaxed text-ww-text/90">
                  {details.overview || 'Sinopse não disponível.'}
                </p>
              </div>

              {/* Gêneros */}
              {details.genres?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {details.genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full border border-ww-border px-3 py-1 text-xs text-ww-muted"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Elenco */}
              {cast.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ww-muted">
                    Elenco principal
                  </h3>
                  <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                    {cast.map((actor) => (
                      <div key={actor.id} className="w-24 shrink-0 text-center">
                        {actor.profile_path ? (
                          <img
                            src={img.profile(actor.profile_path)}
                            alt={actor.name}
                            loading="lazy"
                            className="mx-auto h-24 w-24 rounded-full object-cover"
                          />
                        ) : (
                          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-ww-surface-2 text-2xl">
                            🎭
                          </div>
                        )}
                        <p className="mt-1.5 truncate text-xs font-medium text-ww-text">
                          {actor.name}
                        </p>
                        <p className="truncate text-xs text-ww-muted">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plataformas de streaming (BR) */}
              {providers && (providers.flatrate?.length || providers.rent?.length) ? (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ww-muted">
                    Onde assistir no Brasil
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {providers.flatrate?.map((p) => (
                      <span
                        key={`f-${p.provider_id}`}
                        className="flex items-center gap-2 rounded-lg border border-ww-border bg-ww-bg/60 px-3 py-1.5"
                        title={p.provider_name}
                      >
                        <img
                          src={img.poster(p.logo_path, 'w92')}
                          alt={p.provider_name}
                          loading="lazy"
                          className="h-6 w-6 rounded"
                        />
                        <span className="text-xs text-ww-text">{p.provider_name}</span>
                      </span>
                    ))}
                    {providers.rent?.slice(0, 6).map((p) => (
                      <span
                        key={`r-${p.provider_id}`}
                        className="flex items-center gap-2 rounded-lg border border-ww-border bg-ww-bg/60 px-3 py-1.5"
                        title={`${p.provider_name} (aluguel)`}
                      >
                        <img
                          src={img.poster(p.logo_path, 'w92')}
                          alt={p.provider_name}
                          loading="lazy"
                          className="h-6 w-6 rounded"
                        />
                        <span className="text-xs text-ww-muted">
                          {p.provider_name}
                          <span className="ml-1 text-[10px]">(alugar)</span>
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ww-muted">
                    Onde assistir
                  </h3>
                  <p className="text-sm text-ww-muted">
                    Nenhuma plataforma de streaming informada para o Brasil.
                  </p>
                </div>
              )}

              {/* Títulos semelhantes */}
              {recommendations.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ww-muted">
                    Títulos semelhantes
                  </h3>
                  <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
                    {recommendations.map((rec) => (
                      <RecommendationCard
                        key={`${rec.media_type ?? mediaType}-${rec.id}`}
                        item={rec}
                        fallbackType={mediaType}
                        onOpen={openDetails}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}

/** Card compacto de recomendação dentro do modal */
function RecommendationCard({ item, fallbackType, onOpen }) {
  const mediaType = resolveMediaType(item, fallbackType)
  const title = item.title || item.name
  return (
    <button
      onClick={() => onOpen(mediaType, item.id)}
      className="group w-32 shrink-0 text-left"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-ww-surface-2 ring-2 ring-transparent ring-inset transition group-hover:ring-ww-red">
        {item.poster_path ? (
          <img
            src={img.poster(item.poster_path)}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-xs text-ww-muted">
            {title}
          </div>
        )}
      </div>
      <p className="mt-1.5 truncate text-xs font-medium text-ww-text">{title}</p>
    </button>
  )
}
