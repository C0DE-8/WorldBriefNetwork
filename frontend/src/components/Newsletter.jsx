import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import s from './Newsletter.module.css'
export default function Newsletter({ wide = false }) {
 const [done,setDone] = useState(false)
 return <section className={`${s.box} ${wide ? s.wide : ''}`}><div><span className={s.label}><Icon name="mail" size={16} /> THE WORLD, IN YOUR INBOX</span><h2>A little perspective.<br />Every morning.</h2><p>The stories that matter, thoughtfully curated.<br />Start your day a brief ahead.</p></div><div>{done ? <div className={s.success} role="status"><Icon name="check" /> Your preference is saved on this device.<br />Email delivery is coming soon.</div> : <form onSubmit={e=>{e.preventDefault();localStorage.setItem('wbn-newsletter', e.currentTarget.email.value);setDone(true)}}><label className="srOnly" htmlFor={wide?'wide-email':'email'}>Your email address</label><input id={wide?'wide-email':'email'} name="email" type="email" placeholder="Your email address" required /><button className="darkButton">Keep me in the know <Icon name="arrow" size={16}/></button></form>}<small>Good reads. No noise. <Link to="/privacy">Your privacy matters.</Link></small></div></section>
}
