import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import StoryCard from '../../components/StoryCard'
import Icon from '../../components/Icon'
import s from './Listing.module.css'
import { api } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
export default function Listing({ type, saved, onSave }) {
 const {categories,stories}=useContent()
 const {user}=useAuth();const [followedStories,setFollowedStories]=useState([])
 const {category}=useParams();const [params,setParams]=useSearchParams();const [sort,setSort]=useState('latest');const query=params.get('q')||''
 const categoryName=categories.find(c=>c.toLowerCase()===category)
 useEffect(()=>{if(type==='following'&&user)api('/me/following/stories').then(({data})=>setFollowedStories(data)).catch(()=>setFollowedStories([]))},[type,user])
 const title=type==='saved'?'Your reading room':type==='following'?'Stories from authors you follow':type==='search'?'Follow your curiosity':type==='trending'?'The conversation starts here':categoryName||'Category not found'
 let results=type==='following'?followedStories:stories.filter(story=> type==='saved'?saved.includes(story.id):type==='search'?`${story.title} ${story.description} ${story.category} ${story.author}`.toLowerCase().includes(query.toLowerCase()):type==='trending'?true:story.category===categoryName)
 if(sort==='shortest')results=[...results].sort((a,b)=>parseInt(a.time)-parseInt(b.time));if(sort==='az')results=[...results].sort((a,b)=>a.title.localeCompare(b.title))
 return <><div className={s.pageIntro}><Link to="/" className={s.breadcrumb}>Home / {type||categoryName||'Category'}</Link><div className={s.eyebrow}>WORLD BRIEF NETWORK</div><h1>{title}<span>.</span></h1><p>{type==='saved'?'Good stories deserve a second look. Your saved reads, all in one place.':type==='following'?'A personal news feed from the writers whose work matters to you.':type==='search'?'Find a new idea, a different perspective, or your next great read.':'Go beyond the headlines. Explore the ideas and people shaping our world.'}</p></div>{type==='search'&&<form className={s.searchForm} onSubmit={e=>{e.preventDefault();setParams({q:e.currentTarget.q.value})}}><Icon name="search"/><input aria-label="Search articles" name="q" placeholder="Search stories, topics, or writers…" defaultValue={query} key={query}/><button className="darkButton">Search <Icon name="right" size={16}/></button></form>}<div className={s.resultsBar}><span>{results.length} {results.length===1?'story':'stories'}{query&&` for “${query}”`}</span><label>Sort by <select value={sort} onChange={e=>setSort(e.target.value)}><option value="latest">Featured</option><option value="shortest">Quick reads</option><option value="az">Title A–Z</option></select></label></div>{results.length?<div className={s.threeGrid}>{results.map(story=><StoryCard story={story} key={story.id} saved={saved} onSave={onSave}/>)}</div>:<div className={s.empty}><Icon name={type==='saved'?'bookmark':'search'} size={38}/><h2>{type==='saved'?'Make room for a good read':type==='following'?'Your followed-author feed is empty':'No stories found'}</h2><p>{type==='saved'?'Tap the bookmark on any story to save it here.':type==='following'?(user?'Visit an author profile and choose Follow author.':'Sign in to follow authors and build your personal feed.'):'Try a different word or explore one of our sections.'}</p><Link className="darkButton" to={type==='following'&&!user?'/login':'/'}>{type==='following'&&!user?'Sign in':'Explore stories'} <Icon name="arrow"/></Link></div>}</>
}
