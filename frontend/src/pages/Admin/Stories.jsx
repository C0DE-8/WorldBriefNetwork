import { useEffect, useState } from 'react'
import { getAdminStories, updateStoryStatus } from './adminApi'
import s from './Admin.module.css'

export default function Stories() {
  const [rows, setRows] = useState([]); const [error, setError] = useState('')
  useEffect(() => { getAdminStories().then(({ data }) => setRows(data)).catch((e) => setError(e.message)) }, [])
  async function change(id, status) { try { await updateStoryStatus(id,status); setRows((current) => current.map((row) => row.id === id ? {...row,status} : row)) } catch(e) { setError(e.message) } }
  return <><header className={s.pageHeader}><div><small>EDITORIAL</small><h1>Stories</h1><p>Review and control publishing status.</p></div></header>{error&&<div className={s.error}>{error}</div>}<div className={s.tableWrap}><table><thead><tr><th>Story</th><th>Category</th><th>Author</th><th>Status</th><th>Updated</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td><strong>{row.title}</strong><small>/{row.slug}</small></td><td>{row.category}</td><td>{row.author}</td><td><select value={row.status} onChange={(e)=>change(row.id,e.target.value)}>{['draft','in_review','approved','scheduled','published','unpublished','archived'].map(status=><option key={status}>{status}</option>)}</select></td><td>{new Date(row.updatedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></>
}
