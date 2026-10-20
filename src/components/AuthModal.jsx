import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Modal de autenticação com abas Entrar / Criar conta.
 * E-mail + senha via Supabase, com feedback claro em português.
 */
export default function AuthModal({ open, onClose, onSuccess }) {
  const { signIn, signUp, supabaseReady } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setError(null)
      setInfo(null)
      setBusy(false)
    }
  }, [open])

  // Bloqueia scroll do body enquanto aberto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!email.includes('@')) {
      setError('Informe um e-mail válido.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        onSuccess?.()
        onClose()
      } else {
        const data = await signUp(email, password)
        if (data?.user?.identities?.length === 0) {
          setError('Este e-mail já está cadastrado. Use "Entrar".')
        } else {
          setInfo(
            'Cadastro realizado! Verifique sua caixa de entrada para confirmar o e-mail.'
          )
        }
      }
    } catch (err) {
      const msg = err?.message || 'Algo deu errado. Tente novamente.'
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.')
      } else if (msg.includes('already registered')) {
        setError('Este e-mail já está cadastrado. Use "Entrar".')
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de entrar.')
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="ww-fade-in fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Autenticação"
    >
      <div
        className="ww-fade-up w-full max-w-md rounded-xl border border-ww-border bg-ww-surface p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black">
            <span className="text-ww-red">What</span>Watch
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-ww-muted transition hover:bg-ww-surface-2 hover:text-ww-text"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Abas */}
        <div className="mb-6 flex rounded-lg bg-ww-bg p-1">
          {[
            { id: 'signin', label: 'Entrar' },
            { id: 'signup', label: 'Criar conta' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setMode(tab.id)
                setError(null)
                setInfo(null)
              }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                mode === tab.id
                  ? 'bg-ww-red text-white'
                  : 'text-ww-muted hover:text-ww-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!supabaseReady && (
          <p className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
            Supabase não configurado. Preencha VITE_SUPABASE_URL e
            VITE_SUPABASE_ANON_KEY no arquivo .env.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              className="rounded-lg border border-ww-border bg-ww-bg px-4 py-3 text-ww-text outline-none transition focus:border-ww-red"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="rounded-lg border border-ww-border bg-ww-bg px-4 py-3 text-ww-text outline-none transition focus:border-ww-red"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-ww-red/40 bg-ww-red/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !supabaseReady}
            className="mt-2 rounded-lg bg-ww-red py-3 font-bold text-white transition hover:bg-ww-red-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? 'Aguarde...'
              : mode === 'signin'
                ? 'Entrar'
                : 'Criar minha conta'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed text-ww-muted">
          {mode === 'signin'
            ? 'Ainda não tem conta? Clique em "Criar conta".'
            : 'Após o cadastro, confirme o e-mail recebido para ativar a conta.'}
        </p>
      </div>
    </div>
  )
}
