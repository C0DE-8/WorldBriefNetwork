import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getComments, updateCommentStatus } from '../../api/adminApi'
import s from './Admin.module.css'
import Pagination from './Pagination'
import usePagination from './usePagination'

export default function Moderation() {
  const [rows,setRows]=useState([]);const [error,setError]=useState('');const [params]=useSearchParams();const query=(params.get('q')||'').toLowerCase()
  useEffect(()=>{getComments().then(({data})=>setRows(query?data.filter(row=>`${row.author_name_snapshot} ${row.story_title} ${row.body}`.toLowerCase().includes(query)):data)).catch(e=>setError(e.message))},[query])
  const pagination=usePagination(rows);const {paged}=pagination
  async function change(id,status){try{await updateCommentStatus(id,status);setRows(current=>current.map(row=>row.id===id?{...row,status}:row))}catch(e){setError(e.message)}}
  return <><header className={s.pageHeader}><div><small>COMMUNITY</small><h1>Moderation</h1><p>Review reader contributions and remove harmful content.</p></div></header>{error&&<div className={s.error}>{error}</div>}<div className={s.cards}>{paged.map(row=><article key={row.id} className={s.itemCard}><div><strong>{row.author_name_snapshot}</strong><small>{row.story_title} · {new Date(row.created_at).toLocaleString()}</small></div><p>{row.body}</p><select value={row.status} onChange={e=>change(row.id,e.target.value)}>{['pending','approved','hidden','spam','deleted'].map(status=><option key={status}>{status}</option>)}</select></article>)}</div><Pagination {...pagination}/></>
}
