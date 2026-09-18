import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteStory, getAdminStories, updateStoryStatus } from './adminApi'
import s from './Admin.module.css'

export default function Stories() {
  const [rows, setRows] = useState([]); const [error, setError] = useState('')
  useEffect(() => { getAdminStories().then(({ data }) => setRows(data)).catch((e) => setError(e.message)) }, [])
  async function change(id, status) { try { await updateStoryStatus(id,status); setRows((current) => current.map((row) => row.id === id ? {...row,status} : row)) } catch(e) { setError(e.message) } }
  async function remove(row) { if (!window.confirm(`Archive and remove “${row.title}”?`)) return; try { await deleteStory(row.id); setRows((current)=>current.filter((item)=>item.id!==row.id)) } catch(e) { setError(e.message) } }
  return <><header className={s.pageHeader}><div><small>EDITORIAL</small><h1>Stories</h1><p>Create, edit, publish, and archive reporting.</p></div><Link className={s.primary} to="/admin/stories/new">New story</Link></header>{error&&<div className={s.error}>{error}</div>}<div className={s.tableWrap}><table><thead><tr><th>Story</th><th>Category</th><th>Author</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td><strong>{row.title}</strong><small>/{row.slug}</small></td><td>{row.category}</td><td>{row.author}</td><td><select aria-label={`Status for ${row.title}`} value={row.status} onChange={(e)=>change(row.id,e.target.value)}>{['draft','in_review','approved','scheduled','published','unpublished','archived'].map(status=><option key={status}>{status}</option>)}</select></td><td>{new Date(row.updatedAt).toLocaleDateString()}</td><td><div className={s.rowActions}><Link to={`/admin/stories/${row.id}`}>Edit</Link><button onClick={()=>remove(row)}>Delete</button></div></td></tr>)}</tbody></table></div></>
}
