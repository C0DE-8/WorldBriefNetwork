import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Icon from '../../components/Icon'
import s from './Auth.module.css'

export default function Auth({ mode }) {
  const createAccount = mode === 'signup'
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const destination = location.state?.from || '/'

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const values = { name: data.get('name'), email: data.get('email'), password: data.get('password') }
    try {
      if (createAccount) await signUp(values)
      else await signIn(values)
      navigate(destination)
    } catch (submissionError) {
      setError(submissionError.message)
    } finally {
      setBusy(false)
    }
  }

  if (user) return <section className={s.alreadyIn}>
    <span className={s.avatar}>{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
    <h1>You’re already in the conversation.</h1>
    <p>Continue reading, commenting, and exchanging ideas with the community.</p>
    <Link className="darkButton" to={destination}>Continue <Icon name="right" /></Link>
  </section>

  return <section className={s.authPage}>
    <div className={s.authStory}>
      <div className={s.storyTop}><span className={s.liveDot} /> THE WORLD IS TALKING</div>
      <blockquote>“The best conversations begin with a better understanding of the story.”</blockquote>
      <p>Join readers from around the world. Ask questions, exchange perspectives, and take every story one step further.</p>
      <div className={s.readerStack}><span>AM</span><span>SC</span><span>OW</span><span>+2k</span><small>thoughtful readers already here</small></div>
    </div>
    <div className={s.authPanel}>
      <Link to="/" className={s.backLink}><Icon name="left" size={14} /> Back to the front page</Link>
      <span className={s.kicker}>{createAccount ? 'JOIN THE COMMUNITY' : 'WELCOME BACK'}</span>
      <h1>{createAccount ? 'Create your reader account.' : 'Step back into the conversation.'}</h1>
      <p>{createAccount ? 'Save stories, comment, reply, and build your place in the WorldBriefNetwork community.' : 'Your reading list and conversations are waiting.'}</p>
      <form onSubmit={submit} className={s.authForm}>
        {createAccount && <label>Display name<input name="name" type="text" autoComplete="name" minLength="2" required placeholder="How readers will know you" /></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
        <label>Password<input name="password" type="password" autoComplete={createAccount ? 'new-password' : 'current-password'} minLength="8" required placeholder="At least 8 characters" /></label>
        {!createAccount && <small className={s.switch}><Link to="/forgot-password">Forgot your password?</Link></small>}
        {error && <div className={s.error} role="alert">{error}</div>}
        <button className={s.submitButton} disabled={busy}>{busy ? 'One moment…' : createAccount ? 'Create account' : 'Sign in'} <Icon name="right" size={16} /></button>
      </form>
      <small className={s.switch}>{createAccount ? 'Already have an account?' : 'New to WorldBriefNetwork?'} <Link to={createAccount ? '/login' : '/signup'} state={{ from: destination }}>{createAccount ? 'Sign in' : 'Join the conversation'}</Link></small>
      <small className={s.demoNote}><Icon name="lock" size={12} /> Front-end preview: account data stays on this device.</small>
    </div>
  </section>
}
