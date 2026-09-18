import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Icon from '../../components/Icon'
import s from './ForgotPassword.module.css'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await resetPassword({ email: data.get('email') })
      setDone(true)
    } catch (submissionError) {
      setError(submissionError.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className={s.page}>
    <div className={s.visual}>
      <img src="/logo.png" alt="" />
      <span>READER ACCOUNT</span>
      <h1>Find your way<br />back in.</h1>
      <p>Your saved stories and conversations are still here.</p>
      <div className={s.securityNote}><Icon name="shield" size={18} /><span><b>A private reset.</b> This preview updates only the account stored on your current device.</span></div>
    </div>
    <div className={s.panel}>
      <Link className={s.back} to="/login"><Icon name="left" size={14} /> Back to sign in</Link>
      {done ? <div className={s.success} role="status">
        <span><Icon name="check" size={27} /></span>
        <small>ALL SET</small>
        <h2>Check your email.</h2>
        <p>If an account exists for that address, a secure password-reset link will be sent.</p>
        <Link className="darkButton" to="/login">Continue to sign in <Icon name="right" size={15} /></Link>
      </div> : <>
        <small className={s.kicker}>RESET YOUR PASSWORD</small>
        <h2>A fresh start,<br />without losing your place.</h2>
        <p>Enter your reader-account email and we’ll send a secure password-reset link.</p>
        <form onSubmit={submit} className={s.form}>
          <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
          {error && <div className={s.error} role="alert">{error}</div>}
          <button disabled={busy}>{busy ? 'Sending…' : 'Send reset link'} <Icon name="right" size={15} /></button>
        </form>
        <div className={s.preview}><Icon name="lock" size={13} /><span>Reset links expire after one hour and can only be used once.</span></div>
      </>}
    </div>
  </section>
}
