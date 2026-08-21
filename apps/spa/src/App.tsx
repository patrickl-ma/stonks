import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { authClient } from './lib/auth'

type Mode = 'sign-in' | 'sign-up'

function App() {
  const { data: session, isPending, refetch } = authClient.useSession()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = mode === 'sign-in'
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ name, email, password })

    setIsSubmitting(false)
    if (result.error) {
      setError(result.error.message ?? 'Authentication failed')
      return
    }

    await refetch()
    setPassword('')
  }

  const signOut = async () => {
    await authClient.signOut()
    await refetch()
  }

  if (isPending) {
    return <main className="auth-shell"><p>Loading your session…</p></main>
  }

  if (session) {
    return (
      <main className="auth-shell">
        <section className="card">
          <p className="eyebrow">STONKS</p>
          <h1>Welcome back, {session.user.name}.</h1>
          <p className="muted">You are signed in as {session.user.email}.</p>
          <button type="button" onClick={() => void signOut()}>Sign out</button>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <section className="card">
        <p className="eyebrow">STONKS</p>
        <h1>{mode === 'sign-in' ? 'Sign in' : 'Create your account'}</h1>
        <p className="muted">
          {mode === 'sign-in' ? 'Access your account securely.' : 'Start tracking your market ideas.'}
        </p>

        <form onSubmit={(event) => void submit(event)}>
          {mode === 'sign-up' && (
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button className="link-button" type="button" onClick={() => { setError(null); setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in') }}>
          {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  )
}

export default App
