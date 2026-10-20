/**
 * Cliente da API do TMDB (The Movie Database).
 * Região fixa: Brasil (BR) · Idioma: Português (pt-BR)
 */

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
export const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const REGION = 'BR'
export const LANGUAGE = 'pt-BR'

/** URLs de imagem em alta qualidade com fallback seguro */
export const img = {
  poster: (path, size = 'w342') =>
    path ? `${IMAGE_BASE}/${size}${path}` : null,
  backdrop: (path, size = 'w1280') =>
    path ? `${IMAGE_BASE}/${size}${path}` : null,
  profile: (path, size = 'w185') =>
    path ? `${IMAGE_BASE}/${size}${path}` : null,
}

/**
 * Requisição genérica ao TMDB.
 * Suporta tanto a Chave v3 (query param) quanto o Token v4 (Bearer).
 */
export async function tmdb(path, params = {}) {
  return tmdbRaw(path, params, LANGUAGE)
}

/**
 * Versão de baixo nível que permite sobrescrever o idioma
 * (usada para combinar trailers PT-BR com os originais).
 */
export async function tmdbRaw(path, params = {}, language = LANGUAGE) {
  if (!API_KEY) {
    throw new Error(
      'Chave da API do TMDB não configurada. Preencha VITE_TMDB_API_KEY no arquivo .env'
    )
  }

  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('language', language)
  // Região Brasil — relevante para watch/providers (onde assistir)
  url.searchParams.set('region', REGION)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }

  // Token v4 (começa com "ey") usa Bearer; chave v3 usa query param
  const isV4Token = API_KEY.startsWith('ey')
  if (!isV4Token) url.searchParams.set('api_key', API_KEY)

  const res = await fetch(url, {
    headers: isV4Token ? { Authorization: `Bearer ${API_KEY}` } : undefined,
  })

  if (!res.ok) {
    const message =
      res.status === 401
        ? 'Chave da API do TMDB inválida ou sem permissão.'
        : res.status === 429
          ? 'Limite de requisições do TMDB atingido. Tente em instantes.'
          : `Erro ${res.status} ao consultar o TMDB.`
    throw new Error(message)
  }

  return res.json()
}

/* ============================================================
   Endpoints da home
   ============================================================ */

export const getTrending = (mediaType = 'all', timeWindow = 'week') =>
  tmdb(`/trending/${mediaType}/${timeWindow}`)

export const getPopularMovies = () => tmdb('/movie/popular')

export const getTopRatedMovies = () => tmdb('/movie/top_rated')

export const getPopularSeries = () => tmdb('/tv/popular')

export const getAiringSeries = () => tmdb('/tv/airing_today')

export const getMovieByGenre = (genreId) =>
  tmdb('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc' })

export const getSeriesByGenre = (genreId) =>
  tmdb('/discover/tv', { with_genres: genreId, sort_by: 'popularity.desc' })

export const getGenreList = (mediaType = 'movie') =>
  tmdb(`/genre/${mediaType}/list`)

/* ============================================================
   Lançamentos (novidades por data de estreia)
   Usa discover com filtro de data — mais preciso que os
   endpoints genéricos now_playing/on_the_air, que misturam
   programas antigos.
   ============================================================ */

/** Data no formato YYYY-MM-DD de N dias atrás */
function daysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Filmes lançados recentemente (com nota mínima para evitar títulos vazios) */
export const getNewMovies = () =>
  tmdb('/discover/movie', {
    sort_by: 'primary_release_date.desc',
    'primary_release_date.gte': daysAgo(90),
    'primary_release_date.lte': new Date().toISOString().slice(0, 10),
    'vote_count.gte': 10,
    with_release_type: '2|3', // estreia limitada + ampla
    region: REGION,
  })

/** Séries com estreia recente */
export const getNewSeries = () =>
  tmdb('/discover/tv', {
    sort_by: 'first_air_date.desc',
    'first_air_date.gte': daysAgo(90),
    'first_air_date.lte': new Date().toISOString().slice(0, 10),
    'vote_count.gte': 5,
  })

/** Filmes que ainda vão estrear (próximos lançamentos) */
export const getUpcomingMovies = () =>
  tmdb('/discover/movie', {
    sort_by: 'primary_release_date.asc',
    'primary_release_date.gte': new Date().toISOString().slice(0, 10),
    region: REGION,
  })

/* ============================================================
   Detalhes completos (elenco, trailers, providers, similares)
   ============================================================ */

/**
 * Busca os detalhes completos do título.
 * Obs.:
 * - append_to_response=watch_providers não retorna dados —
 *   usamos o endpoint dedicado /{type}/{id}/watch/providers.
 * - Buscamos vídeos em pt-BR E no idioma original (o TMDB traz trailers
 *   PT-BR apenas quando language=pt-BR, e os originais com language=null).
 */
export async function getDetails(mediaType, id) {
  // Guarda contra tipos inválidos (evita /movie/undefined -> 404 do TMDB)
  const type = mediaType === 'tv' || mediaType === 'movie' ? mediaType : null
  if (!type || !id) {
    throw new Error('Título inválido — não foi possível carregar os detalhes.')
  }

  const [details, providers, videosPt, videosEn] = await Promise.all([
    tmdb(`/${mediaType}/${id}`, {
      append_to_response: 'credits,recommendations',
    }),
    tmdb(`/${mediaType}/${id}/watch/providers`).catch(() => null),
    tmdbRaw(`/${mediaType}/${id}/videos`, {}, 'pt-BR').catch(() => null),
    tmdbRaw(`/${mediaType}/${id}/videos`, {}, 'en-US').catch(() => null),
  ])

  // Combina todos os vídeos, sem duplicar por key
  const seen = new Set()
  const results = []
  for (const v of [
    ...(videosPt?.results ?? []),
    ...(videosEn?.results ?? []),
  ]) {
    if (v?.key && !seen.has(v.key)) {
      seen.add(v.key)
      results.push(v)
    }
  }

  details.videos = { results }
  details['watch/providers'] = providers
  return details
}

/** O TMDB usa 'pt' (não 'pt-br') para vídeos em português */
const isPt = (v) => v.iso_639_1 === 'pt' || v.iso_639_1 === 'pt-br'

/**
 * Escolhe o melhor trailer: PT-BR primeiro, senão qualquer YouTube original.
 */
export function pickTrailer(videos) {
  if (!videos?.results?.length) return null
  const youtube = videos.results.filter((v) => v.site === 'YouTube')
  const ptBr = youtube.find((v) => v.type === 'Trailer' && isPt(v))
  const anyTrailer = youtube.find((v) => v.type === 'Trailer')
  const ptBrClip = youtube.find((v) => isPt(v))
  return ptBr || anyTrailer || ptBrClip || youtube[0] || null
}

/** Plataformas de streaming disponíveis no Brasil */
export function getWatchProviders(watchProviders) {
  const br = watchProviders?.results?.[REGION]
  if (!br) return null
  return {
    flatrate: br.flatrate || [],
    rent: br.rent || [],
    buy: br.buy || [],
    link: br.link || null,
  }
}

/* ============================================================
   Busca
   ============================================================ */

export const searchMulti = (query, page = 1) =>
  tmdb('/search/multi', {
    query,
    page,
    include_adult: false,
  })

/** Anos disponíveis no filtro (do atual até 1950) */
export function getYearOptions() {
  const current = new Date().getFullYear()
  const years = []
  for (let y = current; y >= 1950; y--) years.push(y)
  return years
}

/** Parâmetro de filtro de ano correto para cada tipo de mídia */
function yearParam(mediaType, year) {
  return mediaType === 'tv'
    ? { first_air_date_year: year }
    : { primary_release_year: year }
}

/**
 * Busca combinando texto, tipo (movie/tv/all), gênero, ano e ordenação.
 *
 * - Com texto: usa /search (o filtro de ano do TMDB se chama year; a
 *   ordenação não é suportada pelo /search, então filtramos no cliente).
 * - Sem texto: usa /discover, que aceita gênero, ano e ordenação nativos.
 */
export async function searchByFilters({
  query,
  mediaType = 'all',
  genreId,
  year,
  sortBy = 'popularity.desc',
  page = 1,
}) {
  if (query) {
    const endpoint = mediaType === 'all' ? '/search/multi' : `/search/${mediaType}`
    const data = await tmdb(endpoint, {
      query,
      page,
      include_adult: false,
      // O /search usa 'year' para filmes; para séries, first_air_date_year
      ...(year ? (mediaType === 'tv' ? { first_air_date_year: year } : { year }) : {}),
    })

    // Filtra por ano e gênero no cliente (o /search não suporta gênero)
    const results = (data.results ?? []).filter((r) => {
      if (r.media_type === 'person') return false
      if (year) {
        const date = r.release_date || r.first_air_date || ''
        if (!date.startsWith(String(year))) return false
      }
      if (genreId && !r.genre_ids?.includes(Number(genreId))) return false
      return true
    })

    return { ...data, results }
  }

  // Sem texto: discover por gênero + ano + ordenação
  const type = mediaType === 'all' ? 'movie' : mediaType
  return tmdb(`/discover/${type}`, {
    with_genres: genreId,
    sort_by: sortBy,
    page,
    // Exige um mínimo de votos para a ordenação por nota não trazer títulos obscuros
    ...(sortBy === 'vote_average.desc' ? { 'vote_count.gte': 200 } : {}),
    ...(year ? yearParam(type, year) : {}),
  })
}

/* ============================================================
   Formatação
   ============================================================ */

/**
 * Resolve o tipo de mídia de um item do TMDB de forma segura.
 * Nunca retorna undefined — evita chamadas como /movie/undefined (404).
 * Prioridade: media_type explícito > presença de first_air_date > fallback.
 */
export function resolveMediaType(item, fallback = 'movie') {
  if (item?.media_type === 'tv' || item?.media_type === 'movie') {
    return item.media_type
  }
  if (item?.first_air_date !== undefined && item?.first_air_date !== null) {
    return 'tv'
  }
  return fallback
}

export const formatYear = (dateStr) => (dateStr ? dateStr.slice(0, 4) : '—')

export const formatRuntime = (minutes) => {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${m}min`
}

export const formatVote = (vote) =>
  vote ? vote.toFixed(1).replace('.', ',') : '—'

/** Classificação indicativa (BR) de filmes e séries */
export function getCertification(mediaType, data) {
  if (mediaType === 'movie') {
    const results = data.release_dates?.results || []
    const br = results.find((r) => r.iso_3166_1 === 'BR')
    return br?.release_dates?.find((r) => r.certification)?.certification || null
  }
  const results = data.content_ratings?.results || []
  const br = results.find((r) => r.iso_3166_1 === 'BR')
  return br?.rating || null
}
