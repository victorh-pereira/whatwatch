import { createContext, useContext } from 'react'
import { useLibrary } from '../hooks/useLibrary'

/**
 * Compartilha o estado da biblioteca pessoal (favoritos, avaliações,
 * histórico) entre a Home, a Minha Biblioteca e o modal de detalhes.
 */
const LibraryContext = createContext(null)

export function LibraryProvider({ children }) {
  const library = useLibrary()
  return (
    <LibraryContext.Provider value={library}>
      {children}
    </LibraryContext.Provider>
  )
}

export function useLibraryContext() {
  const ctx = useContext(LibraryContext)
  if (!ctx)
    throw new Error('useLibraryContext deve ser usado dentro de <LibraryProvider>')
  return ctx
}
