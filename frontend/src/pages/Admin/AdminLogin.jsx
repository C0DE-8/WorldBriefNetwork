import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import s from './Admin.module.css'

export default function AdminLogin() {
  const { user, ready, signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (ready && user?.roles?.some((role) => ['editor','moderator','admin','super_admin'].includes(role))) return <Navigate to="/admin" replace />

  async function submit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true); setError('')
    try {
      const account = await signIn(values)
      if (!account.roles?.some((role) => ['editor','moderator','admin','super_admin'].includes(role))) throw new Error('This account does not have admin access.')
      navigate('/admin')
    } catch (submissionError) { setError(submissionError.message) } finally { setBusy(false) }
  }

  return <main className={s.loginPage}><form className={s.loginCard} onSubmit={submit}>
    <span className={s.loginMark}>WBN</span><small>STAFF ADMINISTRATION</small><h1>Welcome back.</h1><p>Sign in with an authorized staff account.</p>
    <label>Email address<input name="email" type="email" autoComplete="username" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" minLength="8" required /></label>
    {error && <div className={s.error} role="alert">{error}</div>}
    <button className={s.primary} disabled={busy}>{busy ? 'Signing in…' : 'Sign in to admin'}</button>
    <a href="/">Return to publication</a>
  </form></main>
}
