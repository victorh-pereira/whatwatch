import { createContext, useContext, useState, useCallback } from 'react'
import DetailModal from '../components/DetailModal'

/**
 * Contexto global do modal de detalhes.
 * Qualquer card da aplicação chama openDetails('movie', 550) e o modal abre.
 */
const DetailModalContext = createContext(null)

export function DetailModalProvider({ children }) {
  const [target, setTarget] = useState(null) // { mediaType, id, options }

  const openDetails = useCallback((mediaType, id, options = {}) => {
    setTarget({ mediaType, id, options })
  }, [])

  const closeDetails = useCallback(() => setTarget(null), [])

  return (
    <DetailModalContext.Provider value={{ openDetails, closeDetails }}>
      {children}
      {target && (
        <DetailModal
          mediaType={target.mediaType}
          id={target.id}
          autoplay={Boolean(target.options?.autoplay)}
          onClose={closeDetails}
        />
      )}
    </DetailModalContext.Provider>
  )
}

export function useDetailModal() {
  const ctx = useContext(DetailModalContext)
  if (!ctx)
    throw new Error('useDetailModal deve ser usado dentro de <DetailModalProvider>')
  return ctx
}
