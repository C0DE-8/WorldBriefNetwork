import { useEffect, useState } from 'react'
import { getComments, updateCommentStatus } from './adminApi'
import s from './Admin.module.css'

export default function Moderation() {
  const [rows,setRows]=useState([]);const [error,setError]=useState('')
  useEffect(()=>{getComments().then(({data})=>setRows(data)).catch(e=>setError(e.message))},[])
  async function change(id,status){try{await updateCommentStatus(id,status);setRows(current=>current.map(row=>row.id===id?{...row,status}:row))}catch(e){setError(e.message)}}
  return <><header className={s.pageHeader}><div><small>COMMUNITY</small><h1>Moderation</h1><p>Review reader contributions and remove harmful content.</p></div></header>{error&&<div className={s.error}>{error}</div>}<div className={s.cards}>{rows.map(row=><article key={row.id} className={s.itemCard}><div><strong>{row.author_name_snapshot}</strong><small>{row.story_title} · {new Date(row.created_at).toLocaleString()}</small></div><p>{row.body}</p><select value={row.status} onChange={e=>change(row.id,e.target.value)}>{['pending','approved','hidden','spam','deleted'].map(status=><option key={status}>{status}</option>)}</select></article>)}</div></>
}
