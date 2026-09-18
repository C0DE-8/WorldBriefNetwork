import { useEffect, useState } from 'react'
import { getContacts, updateContactStatus } from './adminApi'
import s from './Admin.module.css'

export default function Contacts() {
  const [rows,setRows]=useState([]);const [error,setError]=useState('')
  useEffect(()=>{getContacts().then(({data})=>setRows(data)).catch(e=>setError(e.message))},[])
  async function change(id,status){try{await updateContactStatus(id,status);setRows(current=>current.map(row=>row.id===id?{...row,status}:row))}catch(e){setError(e.message)}}
  return <><header className={s.pageHeader}><div><small>INBOX</small><h1>Contact messages</h1><p>Track questions, ideas, partnerships, and corrections.</p></div></header>{error&&<div className={s.error}>{error}</div>}<div className={s.cards}>{rows.length===0&&<p>No contact messages yet.</p>}{rows.map(row=><article key={row.id} className={s.itemCard}><div><strong>{row.name} · {row.subject.replaceAll('_',' ')}</strong><small><a href={`mailto:${row.email}`}>{row.email}</a> · {new Date(row.created_at).toLocaleString()}</small></div><p>{row.message}</p><select value={row.status} onChange={e=>change(row.id,e.target.value)}>{['new','in_progress','resolved','spam'].map(status=><option key={status}>{status}</option>)}</select></article>)}</div></>
}
