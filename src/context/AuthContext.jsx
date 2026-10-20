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

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true

    // Restaura sessão persistida
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
      // Atualiza a UI imediatamente, sem depender do evento assíncrono
      applySession(data.session)
      return data
    },
    [applySession]
  )

  const signUp = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      // Se o cadastro já retornar sessão (confirmação de e-mail desativada),
      // entra direto. Caso contrário, o usuário precisará confirmar o e-mail.
      if (data.session) applySession(data.session)
      return data
    },
    [applySession]
  )

  const signOut = useCallback(async () => {
    // Apaga o histórico de visualizações ANTES de encerrar a sessão.
    //
    // O histórico é o dado que mais cresce e é o que menos precisa persistir:
    // vale apenas enquanto a sessão está ativa. Favoritos, listas e avaliações
    // são preservados.
    //
    // A ordem importa: o DELETE precisa do token válido (RLS), então é feito
    // antes do signOut. Falhas aqui não impedem o logout.
    if (user?.id) {
      try {
        await supabase.from('watch_history').delete().eq('user_id', user.id)
      } catch {
        /* não bloqueia o logout */
      }
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    applySession(null)
  }, [applySession, user])

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
