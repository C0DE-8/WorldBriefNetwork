import { useState } from 'react'
import { Link } from 'react-router-dom'
import { stories } from '../data/stories'
import Icon from '../components/Icon'
import StoryCard from '../components/StoryCard'
import Newsletter from '../components/Newsletter'
import s from './Pages.module.css'

const tabs = ['All stories', 'World', 'Technology', 'Business', 'Culture', 'Lifestyle']

export default function Home({ saved, onSave }) {
  const [tab, setTab] = useState('All stories')
  const [limit, setLimit] = useState(6)
  const [brief, setBrief] = useState(0)
  const briefItems = [
    'The ideas, people, and places shaping a changing world',
    'A fresh perspective on the future of our cities',
    'Explore the stories behind the headlines',
  ]
  const latest = stories.slice(3).filter((story) => tab === 'All stories' || story.category === tab)
  const ranked = [stories[1], stories[6], stories[3], stories[9], stories[8]]

  return <>
    <div className={s.ticker}>
      <span className={s.tickerLabel}><i /> LIVE BRIEFING</span>
      <Link to={`/article/${stories[brief].id}`}>{briefItems[brief]} <Icon name="right" size={13} /></Link>
      <span className={s.tickerEnd}>
        Updated 12 min ago
        <button aria-label="Previous brief" onClick={() => setBrief((brief + 2) % 3)}><Icon name="left" size={14} /></button>
        <button aria-label="Next brief" onClick={() => setBrief((brief + 1) % 3)}><Icon name="next" size={14} /></button>
      </span>
    </div>

    <section className={s.newsDeck} aria-labelledby="front-page-heading">
      <div className={s.deckIntro}>
        <span>THE FRONT PAGE <b>•</b> SEPTEMBER 15, 2026</span>
        <h1 id="front-page-heading">Know your world.<br />Lead the conversation.</h1>
        <p>Essential reporting, unexpected ideas, and a clearer view of the forces changing our world.</p>
      </div>

      <Link to={`/article/${stories[0].id}`} className={s.leadStory}>
        <img src={stories[0].image} alt="Sculptural contemporary architecture reaching toward the sky" />
        <div className={s.leadShade} />
        <div className={s.leadFlag}>THE BIG STORY</div>
        <div className={s.leadContent}>
          <span>{stories[0].category} / {stories[0].location}</span>
          <h2>{stories[0].title}</h2>
          <p>{stories[0].description}</p>
          <small>BY {stories[0].author.toUpperCase()} <i /> {stories[0].time}</small>
        </div>
      </Link>

      <aside className={s.headlineRail} aria-label="Top headlines">
        <div className={s.railHeading}><span>THE HEADLINES</span><Link to="/trending">VIEW ALL <Icon name="arrow" size={13} /></Link></div>
        {stories.slice(1, 5).map((story, index) =>
          <article className={s.railStory} key={story.id}>
            <span className={s.railNumber}>0{index + 1}</span>
            <div>
              <Link to={`/category/${story.category.toLowerCase()}`} className={s.railCategory}>{story.category}</Link>
              <Link to={`/article/${story.id}`}><h3>{story.title}</h3></Link>
              <small>{story.time}</small>
            </div>
          </article>
        )}
      </aside>
    </section>

    <section className={s.trendBar} aria-label="Topics trending now">
      <div className={s.trendTitle}><span>NOW</span><b>Trending across the world</b></div>
      {['Artificial intelligence', 'Cities after dark', 'The clean-energy race', 'A slower way to travel'].map((topic, index) =>
        <Link key={topic} to={`/search?q=${encodeURIComponent(topic)}`}><em>0{index + 1}</em>{topic}<Icon name="arrow" size={12} /></Link>
      )}
    </section>

    <section className={s.latestSection}>
      <div className={s.bigSectionHeading}>
        <div><span>THE LATEST</span><h2>Stories shaping today</h2></div>
        <p>Fresh reporting and perspective,<br />updated throughout the day.</p>
      </div>
      <div className={s.tabs}>
        {tabs.map((item) => <button key={item} className={tab === item ? s.selected : ''} onClick={() => { setTab(item); setLimit(6) }}>{item}</button>)}
        <Link to="/search" aria-label="Search and filter stories"><Icon name="filters" size={16} /></Link>
      </div>
      {latest.length > 0 ? <div className={s.newsGrid}>
        {latest.slice(0, limit).map((story, index) => <div className={index === 0 ? s.newsGridLead : ''} key={story.id}><StoryCard story={story} saved={saved} onSave={onSave} /></div>)}
      </div> : <p className={s.noStories}>More {tab.toLowerCase()} stories are coming soon.</p>}
      {limit < latest.length && <button className={s.loadMore} onClick={() => setLimit(limit + 6)}>Load more stories <Icon name="right" size={15} /></button>}
    </section>

    <section className={s.spotlight}>
      <div className={s.spotlightCopy}>
        <span>FIELD NOTES / 05</span>
        <h2>What the ocean can teach us about a connected world</h2>
        <p>One planet, countless currents. Meet the people looking beneath the surface of our most important shared resource.</p>
        <Link className="darkButton" to={`/article/${stories[6].id}`}>Read the dispatch <Icon name="arrow" size={15} /></Link>
      </div>
      <Link className={s.spotlightImage} to={`/article/${stories[6].id}`}>
        <img src={stories[6].image} alt={stories[6].title} loading="lazy" />
        <span>WORLD <i /> 9 MIN READ</span>
      </Link>
    </section>

    <section className={s.deskSection}>
      <div className={s.bigSectionHeading}>
        <div><span>ACROSS THE NEWSROOM</span><h2>From every desk</h2></div>
        <Link to="/search">Browse all stories <Icon name="arrow" size={15} /></Link>
      </div>
      <div className={s.deskGrid}>{[stories[14], stories[15], stories[16], stories[18]].map((story) => <StoryCard key={story.id} story={story} saved={saved} onSave={onSave} />)}</div>
    </section>

    <section className={s.briefingSection}>
      <div className={s.briefingHeader}><span>THE GLOBAL BRIEFING</span><p>Four continents. Five minutes.<br />The stories to carry into your day.</p></div>
      <Link className={s.briefingLead} to={`/article/${stories[19].id}`}>
        <img src={stories[19].image} alt={stories[19].title} loading="lazy" />
        <div><span>{stories[19].category} / REPORT</span><h2>{stories[19].title}</h2><p>{stories[19].description}</p><small>{stories[19].author} · {stories[19].time}</small></div>
      </Link>
      <div className={s.briefingList}>
        {[stories[12], stories[13], stories[17], stories[7]].map((story, index) => <Link to={`/article/${story.id}`} key={story.id}>
          <em>0{index + 1}</em><img src={story.image} alt="" loading="lazy" /><div><span>{story.category}</span><h3>{story.title}</h3><small>{story.time}</small></div><Icon name="arrow" size={16} />
        </Link>)}
      </div>
    </section>

    <section className={s.popularSection}>
      <div className={s.bigSectionHeading}>
        <div><span>THE READING LIST</span><h2>Most read this week</h2></div>
        <Link to="/trending">See what’s trending <Icon name="arrow" size={15} /></Link>
      </div>
      <div className={s.rankedGrid}>
        {ranked.map((story, index) => <Link to={`/article/${story.id}`} className={s.rankedStory} key={story.id}>
          <strong>0{index + 1}</strong>
          <div><span>{story.category}</span><h3>{story.title}</h3><small>{story.author} · {story.time}</small></div>
          <Icon name="arrow" size={17} />
        </Link>)}
      </div>
    </section>

    <section className={s.cultureSection}>
      <div className={s.bigSectionHeading}>
        <div><span>CULTURE & IDEAS</span><h2>A different perspective</h2></div>
        <Link to="/category/culture">Explore culture <Icon name="arrow" size={15} /></Link>
      </div>
      <div className={s.threeGrid}>{[stories[4], stories[9], stories[10]].map((story) => <StoryCard key={story.id} story={story} saved={saved} onSave={onSave} />)}</div>
    </section>

    <Newsletter wide />
  </>
}
