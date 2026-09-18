import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { api } from '../api/api.js'
import s from './Newsletter.module.css'
export default function Newsletter({ wide = false }) {
 const [done,setDone] = useState(false)
 return <section className={`${s.box} ${wide ? s.wide : ''}`}><div><span className={s.label}><Icon name="mail" size={16} /> THE WORLD, IN YOUR INBOX</span><h2>A little perspective.<br />Every morning.</h2><p>The stories that matter, thoughtfully curated.<br />Start your day a brief ahead.</p></div><div>{done ? <div className={s.success} role="status"><Icon name="check" /> You’re subscribed to The Daily Brief.</div> : <form onSubmit={async e=>{e.preventDefault();await api('/newsletter/subscriptions',{method:'POST',body:JSON.stringify({email:e.currentTarget.email.value})});setDone(true)}}><label className="srOnly" htmlFor={wide?'wide-email':'email'}>Your email address</label><input id={wide?'wide-email':'email'} name="email" type="email" placeholder="Your email address" required /><button className="darkButton">Keep me in the know <Icon name="arrow" size={16}/></button></form>}<small>Good reads. No noise. <Link to="/privacy">Your privacy matters.</Link></small></div></section>
}
