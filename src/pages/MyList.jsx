import { useState } from 'react'
import { useLibraryContext } from '../context/LibraryContext'
import { useDetailModal } from '../context/DetailModalContext'
import { img } from '../lib/tmdb'
import Stars from '../components/Stars'
import AuthModal from '../components/AuthModal'

/**
 * Minha Biblioteca: favoritos, quero assistir, assistidos, avaliações e histórico.
 * Exige login — visitantes veem um convite para entrar.
 */
export default function MyList() {
  const {
    isAuthenticated,
    loading,
    favorites,
    ratings,
    history,
    watchlist,
    toggleFavorite,
    setWatchStatus,
    clearHistory,
  } = useLibraryContext()
  const { openDetails } = useDetailModal()
  const [tab, setTab] = useState('favorites')
  const [authOpen, setAuthOpen] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pb-16 pt-32 text-center">
        <span className="text-5xl">🎬</span>
        <h1 className="mt-4 text-2xl font-black">Sua lista espera por você</h1>
        <p className="mt-2 text-sm leading-relaxed text-ww-muted">
          Entre na sua conta para salvar seus filmes e séries favoritos, montar
          sua lista de "quero assistir", marcar o que já assistiu e acompanhar
          suas avaliações.
        </p>
        <button
          onClick={() => setAuthOpen(true)}
          className="mt-6 rounded-lg bg-ww-red px-8 py-3 font-bold text-white transition hover:bg-ww-red-dark"
        >
          Entrar / Criar conta
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    )
  }

  const wantItems = watchlist.filter((w) => w.status === 'want')
  const watchedItems = watchlist.filter((w) => w.status === 'watched')

  const tabs = [
    { id: 'favorites', label: `Favoritos (${favorites.length})` },
    { id: 'want', label: `Quero assistir (${wantItems.length})` },
    { id: 'watched', label: `Assistidos (${watchedItems.length})` },
    { id: 'ratings', label: `Avaliados (${ratings.length})` },
    { id: 'history', label: `Histórico (${history.length})` },
  ]

  const items =
    tab === 'favorites'
      ? favorites
      : tab === 'want'
        ? wantItems
        : tab === 'watched'
          ? watchedItems
          : tab === 'ratings'
            ? ratings
            : history

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-24 sm:px-6">
      <h1 className="text-2xl font-black sm:text-3xl">Minha Biblioteca</h1>

      {/* Abas */}
      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-ww-red text-white'
                : 'border border-ww-border bg-ww-surface text-ww-muted hover:text-ww-text'
            }`}
          >
            {t.label}
          </button>
        ))}
        {tab === 'history' && history.length > 0 && (
          <button
            onClick={clearHistory}
            className="ml-auto rounded-full border border-ww-border px-4 py-2 text-sm text-ww-muted transition hover:border-ww-red hover:text-ww-text"
          >
            Limpar histórico
          </button>
        )}
      </div>

      {/* Nota sobre o histórico */}
      {tab === 'history' && (
        <p className="mt-4 rounded-lg border border-ww-border bg-ww-surface px-4 py-3 text-xs text-ww-muted">
          💡 O histórico guarda apenas as visualizações recentes da sua sessão
          atual. Ele é apagado automaticamente quando você sai da conta — seus
          favoritos, listas e avaliações continuam salvos.
        </p>
      )}

      {/* Conteúdo */}
      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="ww-skeleton aspect-[2/3]" />
              <div className="ww-skeleton mt-2 h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-ww-muted">
          {tab === 'favorites' && 'Nenhum favorito ainda. Abra um título e clique em "Favoritar".'}
          {tab === 'want' && 'Sua lista de "quero assistir" está vazia. Abra um título e clique em "Quero assistir".'}
          {tab === 'watched' && 'Você ainda não marcou nada como assistido. Marque um título ou avalie com estrelas!'}
          {tab === 'ratings' && 'Você ainda não avaliou nenhum título. Abra um título e clique nas estrelas!'}
          {tab === 'history' && 'Seu histórico está vazio.'}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <div key={`${item.media_type}-${item.media_id}`} className="group relative">
              <button
                onClick={() => openDetails(item.media_type, item.media_id)}
                className="w-full text-left"
                aria-label={`Ver detalhes de ${item.title}`}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-ww-surface-2 ring-2 ring-transparent ring-inset transition group-hover:ring-ww-red">
                  {item.poster_path ? (
                    <img
                      src={img.poster(item.poster_path)}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-xs text-ww-muted">
                      {item.title}
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium text-ww-text">
                  {item.title}
                </p>
              </button>

              {/* Selo de nota / data */}
              <div className="mt-1 flex items-center gap-2">
                {tab === 'ratings' && <Stars value={item.stars} size={14} />}
                {tab === 'history' && item.viewed_at && (
                  <span className="text-xs text-ww-muted">
                    {new Date(item.viewed_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>

              {/* Remover dos favoritos */}
              {tab === 'favorites' && (
                <button
                  onClick={() =>
                    toggleFavorite({
                      id: item.media_id,
                      media_type: item.media_type,
                      title: item.title,
                      poster_path: item.poster_path,
                      backdrop_path: item.backdrop_path,
                      vote_average: item.vote_average,
                      release_date: item.release_date,
                    })
                  }
                  aria-label={`Remover ${item.title} dos favoritos`}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-ww-red"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              {/* Watchlist: ação de mover para a outra lista */}
              {(tab === 'want' || tab === 'watched') && (
                <button
                  onClick={() =>
                    setWatchStatus(
                      {
                        id: item.media_id,
                        media_type: item.media_type,
                        title: item.title,
                        poster_path: item.poster_path,
                        backdrop_path: item.backdrop_path,
                        vote_average: item.vote_average,
                        release_date: item.release_date,
                      },
                      // Na aba "want", mover para assistido; na "watched", voltar para quero assistir
                      tab === 'want' ? 'watched' : 'want'
                    )
                  }
                  title={tab === 'want' ? 'Marcar como assistido' : 'Mover para quero assistir'}
                  aria-label={
                    tab === 'want'
                      ? `Marcar ${item.title} como assistido`
                      : `Mover ${item.title} para quero assistir`
                  }
                  className={`absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100 ${
                    tab === 'want' ? 'hover:bg-green-600' : 'hover:bg-ww-red'
                  }`}
                >
                  {tab === 'want' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
