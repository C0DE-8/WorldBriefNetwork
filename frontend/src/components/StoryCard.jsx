import { Link } from 'react-router-dom'
import Icon from './Icon'
import s from './StoryCard.module.css'
export default function StoryCard({ story, saved, onSave, compact = false }) {
 return <article className={`${s.card} ${compact ? s.compact : ''}`}><Link className={s.image} to={`/article/${story.id}`}><img src={story.image} alt={story.title} loading="lazy" /><span className={s.imageArrow}><Icon name="arrow" /></span></Link><div className={s.content}><Link className={s.category} to={`/category/${story.category.toLowerCase()}`}>{story.category}</Link><Link to={`/article/${story.id}`}><h3>{story.title}</h3></Link>{!compact && <p>{story.description}</p>}<div className={s.meta}><span>{story.author} <i>·</i> {story.time}</span><button aria-label={`${saved.includes(story.id) ? 'Unsave' : 'Save'} ${story.title}`} aria-pressed={saved.includes(story.id)} onClick={() => onSave(story.id)}><Icon name="bookmark" size={16} fill={saved.includes(story.id) ? 'currentColor' : 'none'} /></button></div></div></article>
}
