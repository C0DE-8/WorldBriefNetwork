import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useContent } from '../context/ContentContext'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'
import CookieConsent from './CookieConsent'
import s from './Layout.module.css'

export function Brand() {
  return <Link to="/" className={s.brand} aria-label="WorldBriefNetwork home"><span className={s.brandMark}><img src="/logo.png" alt="" /></span><span>worldbrief<span className={s.network}>network<span className={s.dot}>.</span></span></span></Link>
}

export default function Layout({ saved }) {
  const { categories } = useContent()
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [profile, setProfile] = useState(false)
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  return <>
    <a href="#main" className={s.skip}>Skip to content</a>
    <div className={s.utility}><div><span>Know your world. Lead the conversation.</span><span className={s.utilityRight}>Tuesday, September 15, 2026 <i /> <Icon name="globe" size={12} /> Global edition</span></div></div>
    <header className={s.header}>
      <div className={s.masthead}>
        <Brand />
        <span className={s.tagline}>KNOW YOUR WORLD.<br /><b>LEAD THE CONVERSATION.</b></span>
        <div className={s.actions}>
          <button aria-label="Search stories" onClick={() => setSearch(!search)}><Icon name={search ? 'close' : 'search'} size={21} /></button>
          <Link to="/saved" className={s.saved} aria-label={`Saved stories (${saved.length})`}><Icon name="bookmark" size={20} />{saved.length > 0 && <sup>{saved.length}</sup>}</Link>
          {user ? <div className={s.profileWrap}>
            <button className={s.profileButton} aria-label="Open account menu" aria-expanded={profile} onClick={() => setProfile(!profile)}>{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</button>
            {profile && <div className={s.profileMenu}>
              <span>READER ACCOUNT</span><strong>{user.name}</strong><small>{user.email}</small>
              <Link to="/saved" onClick={() => setProfile(false)}><Icon name="bookmark" size={14} /> Saved stories</Link>
              <Link to="/following" onClick={() => setProfile(false)}><Icon name="user" size={14} /> Followed authors</Link>
              <button onClick={() => { signOut(); setProfile(false) }}><Icon name="logout" size={14} /> Sign out</button>
            </div>}
          </div> : <Link className={s.signIn} to="/login"><Icon name="user" size={16} /> Sign in</Link>}
          <Link to="/newsletter" className="darkButton">The daily brief <Icon name="arrow" size={15} /></Link>
          <button className={s.menuButton} aria-label="Toggle navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon name={menu ? 'close' : 'menu'} /></button>
        </div>
      </div>
      {search && <form className={s.search} onSubmit={(event) => { event.preventDefault(); navigate(`/search?q=${encodeURIComponent(event.currentTarget.query.value)}`); setSearch(false) }}><Icon name="search" /><input name="query" autoFocus required placeholder="What are you curious about?" aria-label="Search stories" /><button className="darkButton">Search <Icon name="right" /></button></form>}
      <nav className={`${s.nav} ${menu ? s.open : ''}`} aria-label="Main navigation"><div><NavLink to="/" end onClick={() => setMenu(false)}>Home</NavLink>{categories.map((category) => <NavLink to={`/category/${category.toLowerCase()}`} key={category} onClick={() => setMenu(false)}>{category}</NavLink>)}<NavLink to="/about" onClick={() => setMenu(false)}>About us <Icon name="down" size={12} /></NavLink></div><Link to="/trending" className={s.trending}><span /> Trending now <Icon name="arrow" size={13} /></Link></nav>
    </header>
    <main id="main" className={s.main}><Outlet /></main>
    <footer className={s.footer}>
      <div className={s.footerTop}><div><Brand /><p>Know your world.<br />Lead the conversation.</p></div><div><h4>Explore</h4><Link to="/category/world">World</Link><Link to="/category/technology">Technology</Link><Link to="/category/culture">Culture</Link></div><div><h4>WorldBriefNetwork</h4><Link to="/about">About us</Link><Link to="/contact">Contact</Link><Link to="/newsletter">The daily brief</Link></div><div><h4>Your reading room</h4><Link to="/saved">Saved stories</Link><Link to="/search">Discover stories</Link><Link to="/privacy">Privacy policy</Link></div></div>
      <div className={s.footerBottom}><span>© 2026 WorldBriefNetwork. All rights reserved.</span><span>Know your world. Lead the conversation.</span><span>Editorial demo · Sample stories</span></div>
    </footer>
    <CookieConsent />
  </>
}
