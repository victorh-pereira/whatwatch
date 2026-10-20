import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

/**
 * Provider de autenticação (e-mail + senha via Supabase).
 *
 * Observação importante sobre o `onAuthStateChange`:
 * O SDK do Supabase usa `navigator.locks` internamente. Se o callback do listener
 * aguardar outra operação de auth, pode ocorrer deadlock e o evento nunca chega —
 * sintoma clássico: o login funciona, mas a UI continua "deslogada".
 *
 * Por isso, além do listener, o estado é atualizado DIRETAMENTE com a sessão
 * retornada por signIn/signUp. Isso garante que a UI reflita o login mesmo que o
 * evento demore ou não dispare.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback((newSession) => {
    setSession(newSession ?? null)
    setUser(newSession?.user ?? null)
    setLoading(false)
  }, [])

  /**
   * Apaga o histórico de visualizações de um usuário no banco.
   *
   * Por que o histórico é tratado assim: é o dado que mais cresce e o que menos
   * precisa persistir — vale apenas enquanto a sessão está ativa. Por isso é
   * limpo ao ENTRAR e ao SAIR, garantindo histórico "sempre fresco" e evitando
   * acúmulo no banco. Favoritos, listas e avaliações não são afetados.
   *
   * Requer a sessão ativa (token válido) por causa da política de segurança RLS.
   * Portanto deve ser chamada enquanto o usuário ainda está autenticado.
   * Falhas não interrompem o fluxo de login/logout.
   */
  const clearHistoryFor = useCallback(async (userId) => {
    if (!userId) return
    try {
      await supabase.from('watch_history').delete().eq('user_id', userId)
    } catch {
      /* não bloqueia o login/logout */
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true

    // Restaura sessão persistida.
    // Obs.: NÃO limpamos o histórico aqui — a limpeza ocorre apenas em um
    // login explícito (com senha) ou no logout, para não zerar o histórico
    // a cada recarregamento (F5).
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) applySession(data.session)
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    // Escuta mudanças de autenticação (login, logout, refresh).
    // O callback é SÍNCRONO de propósito (sem await) para não travar o lock do SDK.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (active) applySession(newSession)
      }
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [applySession])

  const signIn = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // Histórico "sempre fresco": zera o histórico a cada novo login.
      // Feito aqui (e não no listener) porque agora a sessão já está ativa.
      await clearHistoryFor(data.session?.user?.id)
      // Atualiza a UI imediatamente, sem depender do evento assíncrono
      applySession(data.session)
      return data
    },
    [applySession, clearHistoryFor]
  )

  const signUp = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      // Se o cadastro já retornar sessão (confirmação de e-mail desativada),
      // entra direto e o histórico começa vazio (conta nova).
      if (data.session) applySession(data.session)
      return data
    },
    [applySession]
  )

  const signOut = useCallback(async () => {
    // Apaga o histórico ANTES de encerrar a sessão, pois o DELETE precisa do
    // token válido (RLS). Falhas aqui não impedem o logout.
    await clearHistoryFor(user?.id)

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    applySession(null)
  }, [applySession, user, clearHistoryFor])

  const value = {
    session,
    user,
    loading,
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signOut,
    supabaseReady: isSupabaseConfigured,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
