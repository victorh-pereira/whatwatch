import { memo } from 'react'
import { img, formatYear, formatVote, resolveMediaType } from '../lib/tmdb'
import { useDetailModal } from '../context/DetailModalContext'

/**
 * Card de filme/série usado em carrosséis e grades.
 * Abre o modal de detalhes ao clicar.
 */
const MediaCard = memo(function MediaCard({ item }) {
  const { openDetails } = useDetailModal()

  const mediaType = resolveMediaType(item)
  const title = item.title || item.name
  const year = formatYear(item.release_date || item.first_air_date)
  const poster = img.poster(item.poster_path)

  return (
    <button
      onClick={() => openDetails(mediaType, item.id)}
      className="group w-36 shrink-0 text-left sm:w-44"
      aria-label={`Ver detalhes de ${title}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-ww-surface-2 ring-2 ring-transparent ring-inset transition duration-300 group-hover:ring-ww-red group-hover:shadow-xl group-hover:shadow-black/60">
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-xs text-ww-muted">
            {title}
          </div>
        )}
        {/* Brilho no hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100" />
        {item.vote_average > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-yellow-400 backdrop-blur">
            ★ {formatVote(item.vote_average)}
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-medium text-ww-text">{title}</p>
      <p className="text-xs text-ww-muted">
        {year}
        {mediaType === 'tv' && ' · Série'}
      </p>
    </button>
  )
})

export default MediaCard
