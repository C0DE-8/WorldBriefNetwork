import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import s from './Admin.module.css'

const staffRoles = ['editor', 'moderator', 'admin', 'super_admin']

export default function AdminLayout() {
  const { user, ready, signOut } = useAuth()
  const navigate = useNavigate()
  if (!ready) return <div className={s.loading}>Loading admin…</div>
  if (!user) return <Navigate to="/admin/login" replace />
  if (!user.roles?.some((role) => staffRoles.includes(role))) return <Navigate to="/" replace />

  async function logout() {
    await signOut()
    navigate('/admin/login')
  }

  return <div className={s.admin}>
    <aside className={s.sidebar}>
      <NavLink className={s.brand} to="/admin">WBN<span>Admin</span></NavLink>
      <nav>
        <NavLink end to="/admin">Dashboard</NavLink>
        <NavLink to="/admin/stories">Stories</NavLink>
        <NavLink to="/admin/moderation">Moderation</NavLink>
        <NavLink to="/admin/contacts">Contacts</NavLink>
        {user.roles?.some((role) => ['admin','super_admin'].includes(role)) && <NavLink to="/admin/users">Users</NavLink>}
      </nav>
      <div className={s.account}><small>SIGNED IN AS</small><strong>{user.name}</strong><span>{user.email}</span><button onClick={logout}>Sign out</button></div>
    </aside>
    <main className={s.workspace}><Outlet /></main>
  </div>
}
