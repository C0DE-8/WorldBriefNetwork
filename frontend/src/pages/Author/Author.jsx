import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import StoryCard from '../../components/StoryCard'
import s from './Author.module.css'

export default function Author({saved,onSave}){const {slug}=useParams();const {user}=useAuth();const location=useLocation();const [author,setAuthor]=useState(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false)
 useEffect(()=>{api(`/authors/${slug}`).then(({data})=>setAuthor(data)).catch(e=>setError(e.message))},[slug,user])
 async function react(kind){if(!user)return;setBusy(true);try{const active=kind==='follow'?author.followed:author.liked;const {data}=await api(`/authors/${author.id}/${kind}`,{method:active?'DELETE':'PUT'});setAuthor(current=>({...current,...data}))}catch(e){setError(e.message)}finally{setBusy(false)}}
 if(error&&!author)return <div className={s.empty}><h1>{error}</h1><Link to="/">Back home</Link></div>;if(!author)return <p>Loading author…</p>
 return <><section className={s.hero}><div className={s.avatar}>{author.name.split(' ').map(p=>p[0]).join('').slice(0,2)}</div><div><span>WORLD BRIEF NETWORK AUTHOR</span><h1>{author.name}</h1><p>{author.bio||`${author.name} reports and writes for WorldBriefNetwork.`}</p><div className={s.stats}><strong>{author.likeCount}</strong> likes <i/> <strong>{author.followerCount}</strong> followers</div></div>{user?<div style={{display:'flex',gap:8}}><button onClick={()=>react('like')} disabled={busy} aria-pressed={author.liked}>{author.liked?'Liked':'Like author'}</button><button onClick={()=>react('follow')} disabled={busy} aria-pressed={author.followed}>{author.followed?'Following':'Follow author'}</button></div>:<Link className={s.follow} to="/login" state={{from:location.pathname}}>Sign in to follow</Link>}</section>
 <section><h2>Latest from {author.name}</h2><div className={s.grid}>{author.stories.map(story=><StoryCard key={story.id} story={story} saved={saved} onSave={onSave}/>)}</div></section></>
}
