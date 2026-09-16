import { useEffect, useState } from 'react'
import s from './Preloader.module.css'

export default function Preloader() {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const started = performance.now()
    const finish = () => {
      const remaining = Math.max(0, 650 - (performance.now() - started))
      window.setTimeout(() => {
        setLeaving(true)
        window.setTimeout(() => setVisible(false), 450)
      }, remaining)
    }
    if (document.readyState === 'complete') finish()
    else window.addEventListener('load', finish, { once: true })
    return () => window.removeEventListener('load', finish)
  }, [])

  if (!visible) return null
  return <div className={`${s.preloader} ${leaving ? s.leaving : ''}`} role="status" aria-label="Loading WorldBriefNetwork">
    <div className={s.orbit}><img src="/favicon.svg" alt="" /></div>
    <div className={s.wordmark}><strong>worldbrief</strong><span>network.</span></div>
    <p>KNOW YOUR WORLD. LEAD THE CONVERSATION.</p>
    <div className={s.track}><i /></div>
    <small>PREPARING YOUR BRIEFING</small>
  </div>
}
