import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getUsers, updateUserStatus } from '../../api/adminApi'
import s from './Admin.module.css'
import Pagination from './Pagination'
import usePagination from './usePagination'

export default function Users() {
  const [rows,setRows]=useState([]);const [error,setError]=useState('')
  const [params]=useSearchParams();const query=(params.get('q')||'').toLowerCase();useEffect(()=>{getUsers().then(({data})=>setRows(query?data.filter(row=>`${row.name} ${row.email} ${row.roles.join(' ')}`.toLowerCase().includes(query)):data)).catch(e=>setError(e.message))},[query])
  const pagination=usePagination(rows);const {paged}=pagination
  async function change(id,status){try{await updateUserStatus(id,status);setRows(current=>current.map(row=>row.id===id?{...row,status}:row))}catch(e){setError(e.message)}}
  return <><header className={s.pageHeader}><div><small>ACCESS</small><h1>Users</h1><p>Review reader and staff accounts.</p></div></header>{error&&<div className={s.error}>{error}</div>}<div className={s.tableWrap}><table><thead><tr><th>User</th><th>Roles</th><th>Status</th><th>Joined</th></tr></thead><tbody>{paged.map(row=><tr key={row.id}><td><strong>{row.name}</strong><small>{row.email}</small></td><td>{row.roles.join(', ')||'reader'}</td><td><select value={row.status} onChange={e=>change(row.id,e.target.value)}>{['active','suspended','banned'].map(status=><option key={status}>{status}</option>)}</select></td><td>{new Date(row.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div><Pagination {...pagination}/></>
}
