import { useEffect, useState } from 'react'
import { getUsers, updateUserStatus } from './adminApi'
import s from './Admin.module.css'

export default function Users() {
  const [rows,setRows]=useState([]);const [error,setError]=useState('')
  useEffect(()=>{getUsers().then(({data})=>setRows(data)).catch(e=>setError(e.message))},[])
  async function change(id,status){try{await updateUserStatus(id,status);setRows(current=>current.map(row=>row.id===id?{...row,status}:row))}catch(e){setError(e.message)}}
  return <><header className={s.pageHeader}><div><small>ACCESS</small><h1>Users</h1><p>Review reader and staff accounts.</p></div></header>{error&&<div className={s.error}>{error}</div>}<div className={s.tableWrap}><table><thead><tr><th>User</th><th>Roles</th><th>Status</th><th>Joined</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><strong>{row.name}</strong><small>{row.email}</small></td><td>{row.roles.join(', ')||'reader'}</td><td><select value={row.status} onChange={e=>change(row.id,e.target.value)}>{['active','suspended','banned'].map(status=><option key={status}>{status}</option>)}</select></td><td>{new Date(row.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></>
}
