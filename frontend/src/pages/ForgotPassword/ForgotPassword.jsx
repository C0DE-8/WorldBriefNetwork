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
    if (data.get('password') !== data.get('confirmPassword')) return setError('The passwords do not match.')
    setBusy(true)
    try {
      await resetPassword({ email: data.get('email'), password: data.get('password') })
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
        <h2>Your password has been updated.</h2>
        <p>You can now sign in and return to the conversation.</p>
        <Link className="darkButton" to="/login">Continue to sign in <Icon name="right" size={15} /></Link>
      </div> : <>
        <small className={s.kicker}>RESET YOUR PASSWORD</small>
        <h2>A fresh start,<br />without losing your place.</h2>
        <p>Enter the email used for the reader account saved on this device, then choose a new password.</p>
        <form onSubmit={submit} className={s.form}>
          <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
          <label>New password<input name="password" type="password" autoComplete="new-password" minLength="8" required placeholder="At least 8 characters" /></label>
          <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" required placeholder="Repeat your new password" /></label>
          {error && <div className={s.error} role="alert">{error}</div>}
          <button disabled={busy}>{busy ? 'Updating…' : 'Reset password'} <Icon name="right" size={15} /></button>
        </form>
        <div className={s.preview}><Icon name="lock" size={13} /><span>No email is sent in this front-end preview. Production recovery requires a secure email verification service.</span></div>
      </>}
    </div>
  </section>
}
