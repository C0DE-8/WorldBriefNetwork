import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { deleteStory, getAdminStories, updateStoryStatus } from '../../api/adminApi'
import s from './Admin.module.css'
import a from './Stories.module.css'
import Pagination from './Pagination'
import usePagination from './usePagination'

export default function Stories() {
  const [rows, setRows] = useState([]); const [error, setError] = useState('')
  const [params]=useSearchParams();const query=(params.get('q')||'').toLowerCase()
  useEffect(() => { getAdminStories().then(({ data }) => setRows(query?data.filter(row=>`${row.title} ${row.slug} ${row.category} ${row.author} ${row.status}`.toLowerCase().includes(query)):data)).catch((e) => setError(e.message)) }, [query])
  const pagination=usePagination(rows);const {paged}=pagination
  async function change(id, status) { try { await updateStoryStatus(id,status); setRows((current) => current.map((row) => row.id === id ? {...row,status} : row)) } catch(e) { setError(e.message) } }
  async function remove(row) { if (!window.confirm(`Archive and remove “${row.title}”?`)) return; try { await deleteStory(row.id); setRows((current)=>current.filter((item)=>item.id!==row.id)) } catch(e) { setError(e.message) } }
  return <><header className={s.pageHeader}><div><small>EDITORIAL</small><h1>Stories</h1><p>Create, edit, publish, and archive reporting.</p></div><Link className={a.newStory} to="/admin/stories/new">New story</Link></header>{error&&<div className={s.error}>{error}</div>}<div className={s.tableWrap}><table><thead><tr><th>Story</th><th>Category</th><th>Author</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{paged.map((row)=><tr key={row.id}><td><strong>{row.title}</strong><small>/{row.slug}</small></td><td>{row.category}</td><td>{row.author}</td><td><select aria-label={`Status for ${row.title}`} value={row.status} onChange={(e)=>change(row.id,e.target.value)}>{['draft','in_review','approved','scheduled','published','unpublished','archived'].map(status=><option key={status}>{status}</option>)}</select></td><td>{new Date(row.updatedAt).toLocaleDateString()}</td><td><div className={a.actions}><Link className={a.edit} to={`/admin/stories/${row.id}`}>Edit</Link><button className={a.delete} onClick={()=>remove(row)}>Delete</button></div></td></tr>)}</tbody></table></div><Pagination {...pagination}/></>
}
