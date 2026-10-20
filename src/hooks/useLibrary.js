import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/**
 * Converte uma linha do banco (media_id, media_type...) para o formato
 * que os componentes da UI esperam (id, media_type, title, poster_path...).
 * Isso permite reutilizar o MediaCard tanto com dados do TMDB quanto do banco.
 */
function normalizeRow(row) {
  return {
    ...row,
    id: row.media_id,
    name: row.media_type === 'tv' ? row.title : undefined,
    title: row.title,
  }
}

/**
 * Hook central da biblioteca pessoal do usuário:
 * - favoritos (lista pessoal)
 * - watchlist: "quero assistir" (want) / "assistido" (watched)
 * - avaliações (estrelas 1-5) — avaliar marca automaticamente como assistido
 * - histórico de visualizações
 *
 * Todos os dados vivem no Supabase com RLS por usuário.
 */
export function useLibrary() {
  const { user, isAuthenticated } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [ratings, setRatings] = useState([])
  const [history, setHistory] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(false)

  /* ---------------- carregamento ---------------- */
  const reload = useCallback(async () => {
    if (!user) {
      setFavorites([])
      setRatings([])
      setHistory([])
      setWatchlist([])
      return
    }
    setLoading(true)
    const [fav, rat, hist, watch] = await Promise.all([
      supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('ratings')
        .select('*')
        .order('updated_at', { ascending: false }),
      supabase
        .from('watch_history')
        .select('*')
        .order('viewed_at', { ascending: false })
        .limit(30),
      supabase
        .from('watchlist')
        .select('*')
        .order('updated_at', { ascending: false }),
    ])
    setFavorites((fav.data ?? []).map(normalizeRow))
    setRatings((rat.data ?? []).map(normalizeRow))
    setHistory((hist.data ?? []).map(normalizeRow))
    setWatchlist((watch.data ?? []).map(normalizeRow))
    setLoading(false)
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  /* ---------------- ações ---------------- */
  const isFavorite = useCallback(
    (mediaId, mediaType) =>
      favorites.some((f) => f.media_id === mediaId && f.media_type === mediaType),
    [favorites]
  )

  const toggleFavorite = useCallback(
    async (item) => {
      if (!user) return { needsAuth: true }
      const existing = favorites.find(
        (f) => f.media_id === item.id && f.media_type === item.media_type
      )
      if (existing) {
        setFavorites((prev) =>
          prev.filter(
            (f) => !(f.media_id === item.id && f.media_type === item.media_type)
          )
        )
        await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, media_id: item.id, media_type: item.media_type })
        return { added: false }
      }
      const row = {
        user_id: user.id,
        media_id: item.id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average,
        release_date: item.release_date,
      }
      setFavorites((prev) => [{ ...row, created_at: new Date().toISOString() }, ...prev])
      await supabase.from('favorites').insert(row)
      return { added: true }
    },
    [user, favorites]
  )

  const getStars = useCallback(
    (mediaId, mediaType) =>
      ratings.find((r) => r.media_id === mediaId && r.media_type === mediaType)
        ?.stars ?? 0,
    [ratings]
  )

  /* ---------------- watchlist: quero assistir / assistido ---------------- */

  /** Status atual do título: 'want' | 'watched' | null */
  const getWatchStatus = useCallback(
    (mediaId, mediaType) =>
      watchlist.find(
        (w) => w.media_id === mediaId && w.media_type === mediaType
      )?.status ?? null,
    [watchlist]
  )

  /**
   * Define o status do título.
   * Regras:
   * - status é único por título: marcar "assistido" remove de "quero assistir"
   *   automaticamente (upsert na mesma linha)
   * - clicar de novo no mesmo status desmarca (volta a null)
   */
  const setWatchStatus = useCallback(
    async (item, status) => {
      if (!user) return { needsAuth: true }
      const current = watchlist.find(
        (w) => w.media_id === item.id && w.media_type === item.media_type
      )
      const nextStatus = current?.status === status ? null : status

      // Atualização otimista na UI
      setWatchlist((prev) => {
        const others = prev.filter(
          (w) => !(w.media_id === item.id && w.media_type === item.media_type)
        )
        if (!nextStatus) return others
        const row = {
          user_id: user.id,
          media_id: item.id,
          media_type: item.media_type,
          status: nextStatus,
          title: item.title,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average,
          release_date: item.release_date,
          updated_at: new Date().toISOString(),
        }
        return [row, ...others]
      })

      if (!nextStatus) {
        await supabase
          .from('watchlist')
          .delete()
          .match({ user_id: user.id, media_id: item.id, media_type: item.media_type })
        return { status: null }
      }

      const row = {
        user_id: user.id,
        media_id: item.id,
        media_type: item.media_type,
        status: nextStatus,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average,
        release_date: item.release_date,
        updated_at: new Date().toISOString(),
      }
      await supabase
        .from('watchlist')
        .upsert(row, { onConflict: 'user_id,media_id,media_type' })
      return { status: nextStatus }
    },
    [user, watchlist]
  )

  /** Marca como assistido (usado pela regra: avaliar = assistido) */
  const markAsWatched = useCallback(
    async (item) => {
      if (!user) return
      const row = {
        user_id: user.id,
        media_id: item.id,
        media_type: item.media_type,
        status: 'watched',
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average,
        release_date: item.release_date,
        updated_at: new Date().toISOString(),
      }
      setWatchlist((prev) => {
        const others = prev.filter(
          (w) => !(w.media_id === item.id && w.media_type === item.media_type)
        )
        return [row, ...others]
      })
      await supabase
        .from('watchlist')
        .upsert(row, { onConflict: 'user_id,media_id,media_type' })
    },
    [user]
  )

  const setRating = useCallback(
    async (item, stars) => {
      if (!user) return { needsAuth: true }
      const row = {
        user_id: user.id,
        media_id: item.id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        stars,
        updated_at: new Date().toISOString(),
      }
      setRatings((prev) => {
        const others = prev.filter(
          (r) => !(r.media_id === item.id && r.media_type === item.media_type)
        )
        return [row, ...others]
      })
      await supabase
        .from('ratings')
        .upsert(row, { onConflict: 'user_id,media_id,media_type' })

      // Regra: ao dar uma nota, o título vai automaticamente para "Assistido"
      await markAsWatched(item)

      return { ok: true }
    },
    [user, markAsWatched]
  )

  /** Registra no histórico ao abrir os detalhes (upsert atualiza o timestamp) */
  const recordView = useCallback(
    async (item) => {
      if (!user) return
      const row = {
        user_id: user.id,
        media_id: item.id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
        viewed_at: new Date().toISOString(),
      }
      setHistory((prev) => {
        const others = prev.filter(
          (h) => !(h.media_id === item.id && h.media_type === item.media_type)
        )
        return [row, ...others].slice(0, 30)
      })
      await supabase
        .from('watch_history')
        .upsert(row, { onConflict: 'user_id,media_id,media_type' })
    },
    [user]
  )

  const clearHistory = useCallback(async () => {
    if (!user) return
    setHistory([])
    await supabase.from('watch_history').delete().eq('user_id', user.id)
  }, [user])

  return {
    isAuthenticated,
    loading,
    favorites,
    ratings,
    history,
    watchlist,
    isFavorite,
    toggleFavorite,
    getStars,
    setRating,
    recordView,
    clearHistory,
    getWatchStatus,
    setWatchStatus,
    markAsWatched,
  }
}
