import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createStory, getAdminStory, getStoryOptions, saveStory, uploadStoryImage } from '../../api/adminApi'
import s from './Admin.module.css'
import e from './StoryEditor.module.css'

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export default function StoryEditor() {
  const { id } = useParams(); const editing = Boolean(id); const navigate = useNavigate()
  const [options,setOptions]=useState(null); const [story,setStory]=useState(null); const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const [uploading,setUploading]=useState(false); const [imageUrl,setImageUrl]=useState('')
  useEffect(()=>{Promise.all([getStoryOptions(),editing?getAdminStory(id):Promise.resolve({data:null})]).then(([optionResponse,storyResponse])=>{setOptions(optionResponse.data);setStory(storyResponse.data);setImageUrl(storyResponse.data?.imageUrl||'')}).catch(e=>setError(e.message))},[editing,id])
  async function uploadImage(event){const file=event.target.files?.[0];if(!file)return;setUploading(true);setError('');try{const {data}=await uploadStoryImage(file);setImageUrl(data.url)}catch(e){setError(e.message);event.target.value=''}finally{setUploading(false)}}
  async function submit(event){event.preventDefault();setBusy(true);setError('');const raw=Object.fromEntries(new FormData(event.currentTarget));const values={...raw,publishedAt:raw.publishedAt?new Date(raw.publishedAt).toISOString():'',body:raw.body.split(/\n\s*\n/),readingMinutes:Number(raw.readingMinutes),featured:Boolean(raw.featured),commentsEnabled:Boolean(raw.commentsEnabled)};try{await(editing?saveStory(id,values):createStory(values));navigate('/admin/stories')}catch(e){setError(e.message)}finally{setBusy(false)}}
  if(!options||(editing&&!story))return <p>{error||'Loading story editor…'}</p>
  const initial=story||{status:'draft',readingMinutes:5,commentsEnabled:true,categoryId:options.categories[0]?.id,authorId:options.authors[0]?.id}
  return <><header className={s.pageHeader}><div><small>EDITORIAL</small><h1>{editing?'Edit story':'New story'}</h1><p>Write and publish a complete article.</p></div><Link to="/admin/stories">Back to stories</Link></header>{error&&<div className={s.error} role="alert">{error}</div>}<form className={e.form} onSubmit={submit}>
    <label className={e.full}>Headline<input name="title" defaultValue={initial.title} minLength="5" maxLength="300" required/></label>
    <label className={e.full}>Slug<input name="slug" defaultValue={initial.slug} placeholder="generated-from-headline"/></label>
    <label className={e.full}>Summary<textarea name="description" defaultValue={initial.description} rows="3" required/></label>
    <label>Category<select name="categoryId" defaultValue={initial.categoryId}>{options.categories.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <label>Author<select name="authorId" defaultValue={initial.authorId}>{options.authors.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <label>Status<select name="status" defaultValue={initial.status}>{options.statuses.map(item=><option key={item}>{item}</option>)}</select></label>
    <label>Reading time (minutes)<input name="readingMinutes" type="number" min="1" max="120" defaultValue={initial.readingMinutes}/></label>
    <label>Publish date &amp; time<input name="publishedAt" type="datetime-local" defaultValue={toDateTimeLocal(initial.publishedAt)}/><small>Leave blank to use the current time when publishing. Times use your local timezone.</small></label>
    <div className={`${e.full} ${e.uploader}`}><label>Upload story image<input aria-label="Upload story image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage}/></label><small>JPEG, PNG, WebP, or GIF · maximum 5 MB</small>{uploading&&<span>Uploading image…</span>}{imageUrl&&<img src={imageUrl} alt="Story image preview"/>}</div>
    <label className={e.full}>Image URL<input name="imageUrl" type="url" value={imageUrl} onChange={(event)=>setImageUrl(event.target.value)} required/></label>
    <label>Image credit<input name="imageCredit" defaultValue={initial.imageCredit||''}/></label><label>Location / kicker<input name="location" defaultValue={initial.location||''}/></label>
    <label className={`${e.full} ${e.check}`}><input name="featured" type="checkbox" defaultChecked={initial.featured}/> Featured story</label><label className={e.check}><input name="commentsEnabled" type="checkbox" defaultChecked={initial.commentsEnabled}/> Allow comments</label>
    <label className={e.full}>Article body <small>Separate paragraphs with a blank line.</small><textarea name="body" defaultValue={(initial.body||[]).join('\n\n')} rows="16" required/></label>
    <div className={e.full}><button className={e.submit} disabled={busy||uploading}>{busy?'Saving…':editing?'Save changes':'Create story'}</button></div>
  </form></>
}
