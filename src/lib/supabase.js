import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/**
 * Cliente Supabase.
 * Autenticação por e-mail/senha + tabelas: favorites, ratings, watch_history, watchlist
 *
 * Sobre o `lock`:
 * O SDK usa `navigator.locks` por padrão para serializar o acesso ao storage de
 * sessão. Em alguns navegadores/contextos (aba em background, StrictMode do React,
 * chamadas concorrentes), esse lock pode ficar preso e a promessa de login nunca
 * resolve — a UI fica "Aguarde..." para sempre.
 *
 * Aqui usamos um lock em memória (não bloqueante), que preserva a serialização
 * básica sem o risco de deadlock do Web Locks API.
 */
const simpleLock = (() => {
  let queue = Promise.resolve()
  return (_name, _acquireTimeout, fn) => {
    const run = queue.then(() => fn())
    // Garante que a fila continue mesmo se uma operação falhar
    queue = run.then(
      () => undefined,
      () => undefined
    )
    return run
  }
})()

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        lock: simpleLock,
      },
    })
  : null
