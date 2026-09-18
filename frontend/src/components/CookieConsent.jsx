import { useState } from 'react'
import { Link } from 'react-router-dom'
import s from './CookieConsent.module.css'

const key='wbn-cookie-consent'
export default function CookieConsent(){const [choice,setChoice]=useState(()=>localStorage.getItem(key));function save(value){localStorage.setItem(key,value);document.cookie=`wbn_cookie_consent=${value}; Max-Age=31536000; Path=/; SameSite=Lax`;setChoice(value)}if(choice)return null;return <aside className={s.banner} role="dialog" aria-label="Cookie preferences" aria-live="polite"><div><strong>Your privacy choices</strong><p>We use essential cookies to keep accounts secure. You can also allow optional cookies for future site improvements. <Link to="/privacy">Read our privacy policy</Link>.</p></div><div><button onClick={()=>save('essential')}>Essential only</button><button className={s.accept} onClick={()=>save('all')}>Accept all cookies</button></div></aside>}
