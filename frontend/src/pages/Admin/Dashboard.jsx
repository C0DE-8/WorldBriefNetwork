import { useEffect, useState } from 'react'
import { getDashboard } from './adminApi'
import s from './Admin.module.css'

const total = (items = []) => items.reduce((sum, item) => sum + Number(item.count), 0)

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { getDashboard().then((response) => setData(response.data)).catch((requestError) => setError(requestError.message)) }, [])
  return <><header className={s.pageHeader}><div><small>OVERVIEW</small><h1>Dashboard</h1><p>Publication, community, and inbox activity.</p></div></header>
    {error && <div className={s.error}>{error}</div>}
    {!data ? <p>Loading dashboard…</p> : <div className={s.stats}>
      <article><span>Stories</span><strong>{total(data.stories)}</strong><small>{data.stories.find((item) => item.status === 'published')?.count || 0} published</small></article>
      <article><span>Readers</span><strong>{total(data.users)}</strong><small>registered accounts</small></article>
      <article><span>Comments</span><strong>{total(data.comments)}</strong><small>{data.comments.find((item) => item.status === 'pending')?.count || 0} pending</small></article>
      <article><span>Contacts</span><strong>{total(data.contacts)}</strong><small>{data.contacts.find((item) => item.status === 'new')?.count || 0} new</small></article>
      <article><span>Subscribers</span><strong>{total(data.subscribers)}</strong><small>{data.subscribers.find((item) => item.status === 'active')?.count || 0} active</small></article>
    </div>}
  </>
}
