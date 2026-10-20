import { useCallback, useRef } from 'react'
import MediaCard from './MediaCard'

/**
 * Carrossel horizontal com setas de navegação.
 * Responsivo: esconde as setas em telas pequenas (scroll por toque).
 */
export default function Carousel({ title, items = [], loading = false }) {
  const trackRef = useRef(null)

  const scrollBy = useCallback((direction) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({
      left: direction * el.clientWidth * 0.85,
      behavior: 'smooth',
    })
  }, [])

  if (!loading && items.length === 0) return null

  return (
    <section className="group/carrossel relative">
      <h2 className="mb-3 px-4 text-lg font-bold text-ww-text sm:px-6 sm:text-xl">
        {title}
      </h2>

      <div className="relative">
        {/* Trilha */}
        <div
          ref={trackRef}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-36 shrink-0 sm:w-44">
                  <div className="ww-skeleton aspect-[2/3]" />
                  <div className="ww-skeleton mt-2 h-4 w-3/4" />
                </div>
              ))
            : items.map((item) => (
                <MediaCard key={`${item.media_type ?? 'x'}-${item.id}`} item={item} />
              ))}
        </div>

        {/* Setas — só em telas médias/grandes */}
        {!loading && items.length > 4 && (
          <>
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Rolar para a esquerda"
              className="absolute left-0 top-0 z-10 hidden h-[calc(100%-1.5rem)] items-center rounded-l-lg bg-gradient-to-r from-ww-bg/90 to-transparent px-2 text-ww-text opacity-0 transition group-hover/carrossel:opacity-100 hover:text-ww-red md:flex"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Rolar para a direita"
              className="absolute right-0 top-0 z-10 hidden h-[calc(100%-1.5rem)] items-center rounded-r-lg bg-gradient-to-l from-ww-bg/90 to-transparent px-2 text-ww-text opacity-0 transition group-hover/carrossel:opacity-100 hover:text-ww-red md:flex"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>
    </section>
  )
}
