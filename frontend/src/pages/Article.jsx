import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { stories, articleBody } from '../data/stories'
import Icon from '../components/Icon'
import StoryCard from '../components/StoryCard'
import Newsletter from '../components/Newsletter'
import s from './Pages.module.css'

export default function Article({ saved, onSave }) {
  const { id } = useParams()
  const story = stories.find((item) => item.id === id)
  const [shared, setShared] = useState('')

  if (!story) return <div className={s.empty}><h1>Story not found</h1><Link className="darkButton" to="/">Back to the front page</Link></div>

  const related = [
    ...stories.filter((item) => item.id !== id && item.category === story.category),
    ...stories.filter((item) => item.id !== id && item.category !== story.category),
  ].slice(0, 5)
  const paragraphs = articleBody(story)

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: story.title, text: story.description, url: window.location.href })
      else await navigator.clipboard.writeText(window.location.href)
      setShared(navigator.share ? 'Shared successfully' : 'Link copied')
    } catch (error) {
      if (error?.name !== 'AbortError') setShared('Copy the page address to share this story')
    }
  }

  return <>
    <article className={s.article}>
      <Link className={s.breadcrumb} to={`/category/${story.category.toLowerCase()}`}>Home / {story.category}</Link>
      <div className={s.articleHeading}>
        <span className={s.eyebrow}>{story.category} · THE BIG PICTURE</span>
        <h1>{story.title}</h1>
        <p>{story.description}</p>
        <div className={s.articleMeta}>
          <span className={s.avatar}>{story.author.split(' ').map((name) => name[0]).join('')}</span>
          <div><strong>{story.author}</strong><small>September 15, 2026 · {story.time}</small></div>
          <button onClick={() => onSave(id)} aria-pressed={saved.includes(id)}><Icon name="bookmark" fill={saved.includes(id) ? 'currentColor' : 'none'} />{saved.includes(id) ? 'Saved' : 'Save story'}</button>
          <button onClick={share}><Icon name="share" /> Share</button>
        </div>
        {shared && <div role="status" className={s.shareNotice}>{shared}</div>}
      </div>
      <figure className={s.articleImage}>
        <img src={story.image} alt={story.title} />
        <figcaption>Photo: Unsplash · Editorial illustration</figcaption>
      </figure>
      <div className={s.articleBody}>
        <span className={s.demoNote}>EDITORIAL PREVIEW · SAMPLE ARTICLE</span>
        {paragraphs.map((paragraph, index) => <div key={paragraph}>
          <p className={index === 0 ? s.firstParagraph : ''}>{paragraph}</p>
          {index === 1 && related[0] && <aside className={s.inlineRelated} aria-label="Related story">
            <Link to={`/article/${related[0].id}`}><img src={related[0].image} alt="" loading="lazy" /></Link>
            <div><span>RELATED / {related[0].category}</span><Link to={`/article/${related[0].id}`}><h3>{related[0].title}</h3></Link><small>{related[0].time} <Icon name="arrow" size={12} /></small></div>
          </aside>}
        </div>)}
        <blockquote>Know your world. Lead the conversation.</blockquote>
        <p>WorldBriefNetwork brings a thoughtful perspective to the stories that connect us. Explore more from our {story.category.toLowerCase()} desk below.</p>
        <Link to={`/category/${story.category.toLowerCase()}`} className="darkButton">More in {story.category} <Icon name="arrow" size={15} /></Link>
      </div>
    </article>

    <section className={s.relatedSection}>
      <div className={s.bigSectionHeading}>
        <div><span>KEEP READING</span><h2>More stories for you</h2></div>
        <Link to={`/category/${story.category.toLowerCase()}`}>Visit the {story.category} desk <Icon name="arrow" size={15} /></Link>
      </div>
      <div className={s.relatedGrid}>{related.slice(1, 5).map((item) => <StoryCard story={item} key={item.id} saved={saved} onSave={onSave} />)}</div>
    </section>
    <Newsletter wide />
  </>
}
