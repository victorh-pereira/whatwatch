import { useEffect, useState } from 'react'
import HeroBanner from '../components/HeroBanner'
import Carousel from '../components/Carousel'
import {
  getTrending,
  getNewMovies,
  getNewSeries,
  getUpcomingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getPopularSeries,
  getAiringSeries,
  getMovieByGenre,
  getSeriesByGenre,
} from '../lib/tmdb'
import { useLibraryContext } from '../context/LibraryContext'

/**
 * Carrosséis fixos da home, na ordem de exibição.
 * 1º bloco: novidades (o que acabou de chegar)
 * 2º bloco: destaques (o que está em alta / melhor avaliado)
 */
const FIXED_SECTIONS = [
  {
    key: 'trending',
    title: 'Em alta na semana',
    fetcher: () => getTrending('all', 'week'),
  },
  { key: 'new-movies', title: 'Novos filmes', fetcher: getNewMovies },
  { key: 'new-series', title: 'Novas séries', fetcher: getNewSeries },
  { key: 'upcoming', title: 'Em breve nos cinemas', fetcher: getUpcomingMovies },
  { key: 'popular-movies', title: 'Filmes populares', fetcher: getPopularMovies },
  { key: 'popular-series', title: 'Séries em destaque', fetcher: getPopularSeries },
  { key: 'top-rated', title: 'Melhores avaliados', fetcher: getTopRatedMovies },
  { key: 'airing', title: 'Séries no ar hoje', fetcher: getAiringSeries },
]

/** Carrosséis de gênero exibidos no fim da home */
const GENRE_SECTIONS = [
  { genreId: 28, mediaType: 'movie', label: 'Ação' },
  { genreId: 35, mediaType: 'movie', label: 'Comédia' },
  { genreId: 27, mediaType: 'movie', label: 'Terror' },
  { genreId: 878, mediaType: 'movie', label: 'Ficção científica' },
  { genreId: 9648, mediaType: 'movie', label: 'Mistério' },
  { genreId: 18, mediaType: 'tv', label: 'Dramas' },
  { genreId: 10759, mediaType: 'tv', label: 'Ação e aventura' },
  { genreId: 10765, mediaType: 'tv', label: 'Ficção e fantasia' },
]

/** Remove pessoas e itens sem arte (evita cards vazios) */
const cleanResults = (data) =>
  (data?.results ?? []).filter(
    (r) => r.media_type !== 'person' && (r.poster_path || r.backdrop_path)
  )

export default function Home() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const { history } = useLibraryContext()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // 1) Seções fixas em paralelo
      const fixedResults = await Promise.allSettled(
        FIXED_SECTIONS.map((s) => s.fetcher())
      )
      if (cancelled) return

      const fixedSections = FIXED_SECTIONS.map((section, i) => ({
        title: section.title,
        items:
          fixedResults[i].status === 'fulfilled'
            ? cleanResults(fixedResults[i].value)
            : [],
      })).filter((s) => s.items.length > 0)

      if (!cancelled) setSections(fixedSections)

      // 2) Seções de gênero em paralelo
      const genreResults = await Promise.allSettled(
        GENRE_SECTIONS.map((g) =>
          g.mediaType === 'movie'
            ? getMovieByGenre(g.genreId)
            : getSeriesByGenre(g.genreId)
        )
      )
      if (cancelled) return

      const genreSections = GENRE_SECTIONS.map((g, i) => ({
        title: g.label,
        items:
          genreResults[i].status === 'fulfilled'
            ? cleanResults(genreResults[i].value)
            : [],
      })).filter((s) => s.items.length > 0)

      if (!cancelled) {
        setSections([...fixedSections, ...genreSections])
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="pb-16">
      <HeroBanner />

      <div className="relative z-10 -mt-12 flex flex-col gap-8 sm:-mt-16">
        {/* Histórico recente (usuário logado) — sempre no topo */}
        {history.length > 0 && (
          <Carousel title="Vistos recentemente" items={history} />
        )}

        {sections.map((section) => (
          <Carousel
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}

        {loading && sections.length === 0 && (
          <>
            <Carousel title="Em alta na semana" loading />
            <Carousel title="Novos filmes" loading />
            <Carousel title="Novas séries" loading />
          </>
        )}
      </div>
    </div>
  )
}
