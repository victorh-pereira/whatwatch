import { useState } from 'react'

/**
 * Avaliação com estrelas 1 a 5.
 * Modo "interactive" permite clicar; caso contrário só exibe.
 */
export default function Stars({
  value = 0,
  onChange,
  interactive = false,
  size = 20,
}) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  if (!interactive) {
    return (
      <div className="flex items-center gap-0.5" aria-label={`Nota: ${value} de 5 estrelas`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <svg
            key={n}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={n <= value ? '#facc15' : '#3a3a48'}
            stroke="none"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
      role="radiogroup"
      aria-label="Avaliar com estrelas"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
          className="transition-transform hover:scale-125"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={n <= shown ? '#facc15' : '#3a3a48'}
            stroke="none"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {shown > 0 && (
        <span className="ml-1 text-sm text-ww-muted">
          {shown}/5
        </span>
      )}
    </div>
  )
}
