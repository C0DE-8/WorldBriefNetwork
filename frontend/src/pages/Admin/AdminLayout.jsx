import { useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import s from './Admin.module.css'
import shell from './AdminShell.module.css'

const staffRoles = ['editor', 'moderator', 'admin', 'super_admin']

export default function AdminLayout() {
  const { user, ready, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [collapsed,setCollapsed] = useState(()=>localStorage.getItem('wbn-admin-sidebar')==='collapsed')
  if (!ready) return <div className={s.loading}>Loading admin…</div>
  if (!user) return <Navigate to="/admin/login" replace />
  if (!user.roles?.some((role) => staffRoles.includes(role))) return <Navigate to="/" replace />

  async function logout() {
    await signOut()
    navigate('/admin/login')
  }

  function toggle(){setCollapsed(current=>{localStorage.setItem('wbn-admin-sidebar',current?'expanded':'collapsed');return !current})}
  function search(event){event.preventDefault();const q=event.currentTarget.q.value.trim();const base=location.pathname==='/admin'?'/admin/stories':location.pathname;navigate(`${base}${q?`?q=${encodeURIComponent(q)}`:''}`)}
  return <div className={`${shell.shell} ${collapsed?shell.collapsed:''}`}>
    <aside className={shell.sidebar}>
      <NavLink className={shell.brand} to="/admin">WBN<em>ADMIN</em></NavLink>
      <nav className={shell.nav}>
        <NavLink end to="/admin"><i>DB</i><b>Dashboard</b></NavLink>
        <NavLink to="/admin/stories"><i>ST</i><b>Stories</b></NavLink>
        <NavLink to="/admin/authors"><i>AU</i><b>Authors</b></NavLink>
        <NavLink to="/admin/moderation"><i>CM</i><b>Moderation</b></NavLink>
        <NavLink to="/admin/contacts"><i>IN</i><b>Contacts</b></NavLink>
        {user.roles?.some((role) => ['admin','super_admin'].includes(role)) && <NavLink to="/admin/users"><i>US</i><b>Users</b></NavLink>}
        {user.roles?.some((role) => ['admin','super_admin'].includes(role)) && <NavLink to="/admin/account-requests"><i>RQ</i><b>Requests</b></NavLink>}
      </nav>
      <div className={shell.account}><small>SIGNED IN AS</small><strong>{user.name}</strong><span>{user.email}</span><NavLink to="/admin/profile">Manage profile</NavLink><button onClick={logout}>Sign out</button></div>
    </aside>
    <div className={shell.content}><header className={shell.toolbar}><button className={shell.collapse} onClick={toggle} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'}>{collapsed?'→':'←'}</button><form className={shell.search} onSubmit={search}><span>⌕</span><input name="q" defaultValue={params.get('q')||''} key={`${location.pathname}-${params.get('q')}`} aria-label="Search admin" placeholder="Search this section…"/><button>Search</button></form><div className={shell.toolbarMeta}><strong>WorldBriefNetwork</strong><small>Newsroom administration</small></div></header><main className={shell.workspace}><Outlet /></main></div>
  </div>
}
