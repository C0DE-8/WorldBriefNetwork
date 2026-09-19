import { useEffect, useState } from 'react'
import { approveAccountRequest, getAccountRequests, rejectAccountRequest } from '../../api/adminApi'
import Pagination from './Pagination'
import usePagination from './usePagination'
import s from './Admin.module.css'
import a from './Authors.module.css'

export default function AccountRequests(){
 const [rows,setRows]=useState([]);const [error,setError]=useState('')
 useEffect(()=>{getAccountRequests().then(({data})=>setRows(data)).catch(e=>setError(e.message))},[])
 const pagination=usePagination(rows)
 async function decide(row,approve){if(row.requestType==='account_deletion'&&approve&&!window.confirm(`Permanently delete ${row.userName}'s account and associated data?`))return;try{await(approve?approveAccountRequest(row.id):rejectAccountRequest(row.id));setRows(current=>current.filter(item=>item.id!==row.id))}catch(e){setError(e.message)}}
 return <><header className={s.pageHeader}><div><small>ACCOUNT CONTROL</small><h1>Account requests</h1><p>Approve profile changes or permanently delete requested accounts.</p></div></header>{error&&<div className={s.error}>{error}</div>}<div className={s.cards}>{pagination.paged.length===0&&<p>No pending account requests.</p>}{pagination.paged.map(row=><article className={s.itemCard} key={row.id}><div><strong>{row.userName}</strong><small>{row.email} · {new Date(row.createdAt).toLocaleString()}</small></div><div><b>{row.requestType==='profile_change'?'Profile change':'Permanent account deletion'}</b>{row.proposedData&&<p>Requested name: {row.proposedData.name}<br/>Requested email: {row.proposedData.email}</p>}</div><div className={a.rowActions}><button className={a.edit} onClick={()=>decide(row,true)}>Approve</button><button className={a.delete} onClick={()=>decide(row,false)}>Reject</button></div></article>)}</div><Pagination {...pagination}/></>
}
