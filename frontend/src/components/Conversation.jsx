import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'
import s from './Conversation.module.css'

const seedComments = [
  { id: 'seed-1', authorId: 'reader-maya', author: 'Maya R.', text: 'The most interesting part for me is how this changes ordinary daily life. I would love to hear what readers in other cities are seeing.', createdAt: '2026-09-15T16:18:00.000Z', likes: 24, replies: [{ id: 'seed-r1', authorId: 'reader-theo', author: 'Theo K.', text: 'That is exactly what stood out to me too. The local details are where these big ideas become real.', createdAt: '2026-09-15T16:31:00.000Z', likes: 8 }] },
  { id: 'seed-2', authorId: 'reader-lina', author: 'Lina Chen', text: 'A useful piece of context. The question I am left with is who gets invited into the decisions early enough to shape the outcome.', createdAt: '2026-09-15T15:42:00.000Z', likes: 39, replies: [] },
  { id: 'seed-3', authorId: 'reader-david', author: 'David O.', text: 'There is a hopeful idea here, but the implementation will matter just as much as the ambition.', createdAt: '2026-09-15T14:57:00.000Z', likes: 17, replies: [] },
]

const initials = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
const commentsKey = (storyId) => `wbn-comments-${storyId}`

function readComments(storyId) {
  try {
    return JSON.parse(localStorage.getItem(commentsKey(storyId)) || 'null') || seedComments
  } catch {
    return seedComments
  }
}

function Comment({ comment, user, onReply, onLike, liked, replying, setReplying }) {
  const [reply, setReply] = useState('')
  return <article className={s.comment}>
    <div className={s.commentLine}><span className={s.commentAvatar}>{initials(comment.author)}</span><i /></div>
    <div className={s.commentContent}>
      <div className={s.commentTop}><strong>{comment.author}</strong>{comment.authorId === user?.id && <span>YOU</span>}<time>{new Date(comment.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div>
      <p>{comment.text}</p>
      <div className={s.commentActions}>
        <button className={liked ? s.liked : ''} onClick={() => onLike(comment.id)}><Icon name="heart" size={14} fill={liked ? 'currentColor' : 'none'} /> {comment.likes + (liked ? 1 : 0)}</button>
        <button onClick={() => setReplying(!user ? 'login' : replying === comment.id ? '' : comment.id)}><Icon name="reply" size={14} /> Reply</button>
      </div>
      {comment.replies?.map((item) => <div className={s.reply} key={item.id}>
        <span className={s.replyAvatar}>{initials(item.author)}</span><div><div className={s.commentTop}><strong>{item.author}</strong>{item.authorId === user?.id && <span>YOU</span>}<time>{new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div><p>{item.text}</p></div>
      </div>)}
      {replying === comment.id && user && <form className={s.replyForm} onSubmit={(event) => { event.preventDefault(); if (!reply.trim()) return; onReply(comment.id, reply.trim()); setReply(''); setReplying('') }}>
        <span>{initials(user.name)}</span><input value={reply} onChange={(event) => setReply(event.target.value)} autoFocus maxLength="500" placeholder={`Reply to ${comment.author}…`} /><button aria-label="Send reply"><Icon name="send" size={15} /></button>
      </form>}
    </div>
  </article>
}

export default function Conversation({ storyId }) {
  const { user } = useAuth()
  const location = useLocation()
  const [comments, setComments] = useState(() => readComments(storyId))
  const [message, setMessage] = useState('')
  const [sort, setSort] = useState('top')
  const [replying, setReplying] = useState('')
  const [liked, setLiked] = useState([])
  const readerCount = useMemo(() => 28 + storyId.length * 3, [storyId])
  const visibleComments = [...comments].sort((a, b) => sort === 'latest' ? new Date(b.createdAt) - new Date(a.createdAt) : b.likes - a.likes)
  const total = comments.reduce((count, comment) => count + 1 + (comment.replies?.length || 0), 0)

  function save(next) {
    setComments(next)
    localStorage.setItem(commentsKey(storyId), JSON.stringify(next))
  }

  function post(event) {
    event.preventDefault()
    if (!message.trim() || !user) return
    const comment = { id: crypto.randomUUID(), authorId: user.id, author: user.name, text: message.trim(), createdAt: new Date().toISOString(), likes: 0, replies: [] }
    save([comment, ...comments])
    setMessage('')
    setSort('latest')
  }

  function reply(commentId, text) {
    save(comments.map((comment) => comment.id === commentId ? { ...comment, replies: [...(comment.replies || []), { id: crypto.randomUUID(), authorId: user.id, author: user.name, text, createdAt: new Date().toISOString(), likes: 0 }] } : comment))
  }

  function like(commentId) {
    if (!user) return setReplying('login')
    setLiked((current) => current.includes(commentId) ? current.filter((id) => id !== commentId) : [...current, commentId])
  }

  return <section className={s.conversation} aria-labelledby="conversation-heading">
    <div className={s.conversationHeader}>
      <div><span className={s.live}><i /> LIVE CONVERSATION</span><h2 id="conversation-heading">Talk about this story</h2><p>Bring a question. Add context. Keep it human.</p></div>
      <div className={s.presence}><span>MR</span><span>LC</span><span>DO</span><b>{readerCount} reading now</b></div>
    </div>

    {user ? <form className={s.composer} onSubmit={post}>
      <span className={s.userAvatar}>{initials(user.name)}</span>
      <div><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength="1000" placeholder="What’s your perspective?" rows="3" /><div><small>{message.length}/1000 · Be curious, constructive, and kind.</small><button disabled={!message.trim()}>Join the conversation <Icon name="send" size={14} /></button></div></div>
    </form> : <div className={s.joinPrompt}>
      <span><Icon name="messages" size={23} /></span><div><h3>Your perspective belongs here.</h3><p>Sign in to comment, reply, and connect with other readers.</p></div><Link to="/login" state={{ from: location.pathname }}>Sign in</Link><Link to="/signup" state={{ from: location.pathname }}>Create account</Link>
    </div>}

    {replying === 'login' && !user && <div className={s.loginNotice}>Sign in to react to reader comments. <Link to="/login" state={{ from: location.pathname }}>Sign in</Link></div>}
    <div className={s.conversationBar}><strong>{total} contributions</strong><div><button className={sort === 'top' ? s.activeSort : ''} onClick={() => setSort('top')}>Top</button><button className={sort === 'latest' ? s.activeSort : ''} onClick={() => setSort('latest')}>Latest</button></div></div>
    <div className={s.comments}>{visibleComments.map((comment) => <Comment key={comment.id} comment={comment} user={user} onReply={reply} onLike={like} liked={liked.includes(comment.id)} replying={replying} setReplying={setReplying} />)}</div>
    <div className={s.guidelines}><Icon name="shield" size={15} /><span><b>A better conversation.</b> Challenge ideas, not people. Comments are stored locally in this preview.</span><Link to="/about">Community guide <Icon name="arrow" size={12} /></Link></div>
  </section>
}
