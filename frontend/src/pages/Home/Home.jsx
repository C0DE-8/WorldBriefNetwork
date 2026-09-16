import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { stories } from '../../data/stories'
import Icon from '../../components/Icon'
import StoryCard from '../../components/StoryCard'
import Newsletter from '../../components/Newsletter'
import s from './Home.module.css'

const tabs = ['All stories', 'World', 'Technology', 'Business', 'Culture', 'Lifestyle']

export default function Home({ saved, onSave }) {
  const [tab, setTab] = useState('All stories')
  const [limit, setLimit] = useState(6)
  const [brief, setBrief] = useState(0)
  const [featureIndex, setFeatureIndex] = useState(0)
  const [featurePaused, setFeaturePaused] = useState(false)
  const briefItems = [
    'The ideas, people, and places shaping a changing world',
    'A fresh perspective on the future of our cities',
    'Explore the stories behind the headlines',
  ]
  const latest = stories.slice(3).filter((story) => tab === 'All stories' || story.category === tab)
  const ranked = [stories[1], stories[6], stories[3], stories[9], stories[8]]
  const featureSlides = stories.slice(0, 5)
  const featureStory = featureSlides[featureIndex]
  const readerVoices = [
    { name: 'Maya R.', initials: 'MR', place: 'Nairobi', story: stories[0], quote: 'The local details are where these big ideas become real.' },
    { name: 'Lina Chen', initials: 'LC', place: 'Singapore', story: stories[18], quote: 'This gave me a much clearer way to think about preparedness.' },
    { name: 'David O.', initials: 'DO', place: 'London', story: stories[6], quote: 'Hopeful, but the implementation matters as much as the ambition.' },
  ]

  useEffect(() => {
    if (featurePaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = window.setInterval(() => setFeatureIndex((current) => (current + 1) % featureSlides.length), 6500)
    return () => window.clearInterval(timer)
  }, [featureIndex, featurePaused, featureSlides.length])

  const changeFeature = (direction) => setFeatureIndex((current) => (current + direction + featureSlides.length) % featureSlides.length)

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

      <div className={s.leadStage} onMouseEnter={() => setFeaturePaused(true)} onMouseLeave={() => setFeaturePaused(false)} onFocusCapture={() => setFeaturePaused(true)} onBlurCapture={() => setFeaturePaused(false)}>
        <Link to={`/article/${featureStory.id}`} className={s.leadStory} aria-live="polite">
          <img key={featureStory.id} src={featureStory.image} alt={featureStory.title} />
          <div className={s.leadShade} />
          <div className={s.leadFlag}>{featureIndex === 0 ? 'THE BIG STORY' : 'FEATURED NOW'}</div>
          <div className={s.leadContent} key={`${featureStory.id}-content`}>
            <span>{featureStory.category} / {featureStory.location || 'WORLD BRIEFING'}</span>
            <h2>{featureStory.title}</h2>
            <p>{featureStory.description}</p>
            <small>BY {featureStory.author.toUpperCase()} <i /> {featureStory.time}</small>
          </div>
        </Link>
        <div className={s.slideControls}>
          <span><b>0{featureIndex + 1}</b> / 0{featureSlides.length}</span>
          <div><button aria-label="Previous featured story" onClick={() => changeFeature(-1)}><Icon name="left" size={15} /></button><button aria-label={featurePaused ? 'Play featured stories' : 'Pause featured stories'} onClick={() => setFeaturePaused(!featurePaused)}><Icon name={featurePaused ? 'play' : 'pause'} size={14} /></button><button aria-label="Next featured story" onClick={() => changeFeature(1)}><Icon name="next" size={15} /></button></div>
        </div>
        <div className={s.slideTimer}><i key={`${featureStory.id}-timer`} className={featurePaused ? s.timerPaused : ''} /></div>
      </div>

      <aside className={s.headlineRail} aria-label="Top headlines">
        <div className={s.railHeading}><span>THE HEADLINES</span><Link to="/trending">VIEW ALL <Icon name="arrow" size={13} /></Link></div>
        {featureSlides.map((story, index) =>
          <button className={`${s.railStory} ${featureIndex === index ? s.activeRailStory : ''} ${featurePaused ? s.railPaused : ''}`} key={story.id} onClick={() => setFeatureIndex(index)} aria-label={`Show featured story: ${story.title}`}>
            <span className={s.railNumber}>0{index + 1}</span>
            <div>
              <span className={s.railCategory}>{story.category}</span>
              <h3>{story.title}</h3>
              <small>{story.time}</small>
            </div>
            <i className={s.railProgress} />
          </button>
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

    <section className={s.longReadSection}>
      <Link className={s.longReadImage} to={`/article/${stories[11].id}`}><img src={stories[11].image} alt={stories[11].title} loading="lazy" /><span>THE LONG READ · 8 MIN</span></Link>
      <div className={s.longReadCopy}><span>EARTH / CONSERVATION</span><h2>{stories[11].title}</h2><p>{stories[11].description} Travel into the landscapes where protection is becoming a shared practice, not just a promise.</p><div><i>DB</i><small>Reported by<br /><b>{stories[11].author}</b></small></div><Link to={`/article/${stories[11].id}`}>Settle in and read <Icon name="arrow" size={15} /></Link></div>
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

    <section className={s.quickReadsSection}>
      <div className={s.quickIntro}><span>SHORT ON TIME?</span><h2>Four stories.<br />Twenty minutes.</h2><p>A quick route through culture, travel, sport, and public life.</p><Link to="/search">Find a quick read <Icon name="arrow" size={14} /></Link></div>
      <div className={s.quickList}>{[stories[17], stories[13], stories[8], stories[7]].map((story, index) => <Link to={`/article/${story.id}`} key={story.id}><strong>0{index + 1}</strong><img src={story.image} alt="" loading="lazy" /><div><span>{story.category} · {story.time}</span><h3>{story.title}</h3></div><Icon name="arrow" size={16} /></Link>)}</div>
    </section>

    <section className={s.deskSection}>
      <div className={s.bigSectionHeading}>
        <div><span>ACROSS THE NEWSROOM</span><h2>From every desk</h2></div>
        <Link to="/search">Browse all stories <Icon name="arrow" size={15} /></Link>
      </div>
      <div className={s.deskGrid}>{[stories[14], stories[15], stories[16], stories[18]].map((story) => <StoryCard key={story.id} story={story} saved={saved} onSave={onSave} />)}</div>
    </section>

    <section className={s.ideasSection}>
      <div className={s.bigSectionHeading}><div><span>THE IDEAS LAB</span><h2>Thinking past tomorrow</h2></div><p>People, experiments, and possibilities<br />changing what comes next.</p></div>
      <div className={s.ideasGrid}>{[stories[18], stories[14], stories[12]].map((story, index) => <article key={story.id} className={index === 0 ? s.ideaLead : ''}><Link to={`/article/${story.id}`}><img src={story.image} alt={story.title} loading="lazy" /></Link><div><span>IDEA 0{index + 1} / {story.category}</span><Link to={`/article/${story.id}`}><h3>{story.title}</h3></Link><p>{story.description}</p><small>{story.author} · {story.time}</small></div></article>)}</div>
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

    <section className={s.worldWindowSection}>
      <div className={s.worldWindowHead}><span>WORLD WINDOW</span><h2>Four places to watch</h2><p>Local stories with consequences that travel far beyond the map.</p></div>
      <div className={s.worldWindowGrid}>{[
        ['EUROPE', stories[13]], ['PACIFIC', stories[6]], ['AMERICAS', stories[15]], ['GLOBAL CITIES', stories[19]],
      ].map(([region, story], index) => <Link to={`/article/${story.id}`} key={region}><div className={s.regionTop}><span>{region}</span><em>0{index + 1}</em></div><img src={story.image} alt="" loading="lazy" /><h3>{story.title}</h3><small>{story.time} <Icon name="arrow" size={12} /></small></Link>)}</div>
    </section>

    <section className={s.cultureSection}>
      <div className={s.bigSectionHeading}>
        <div><span>CULTURE & IDEAS</span><h2>A different perspective</h2></div>
        <Link to="/category/culture">Explore culture <Icon name="arrow" size={15} /></Link>
      </div>
      <div className={s.threeGrid}>{[stories[4], stories[9], stories[10]].map((story) => <StoryCard key={story.id} story={story} saved={saved} onSave={onSave} />)}</div>
    </section>

    <section className={s.weekendSection}>
      <div className={s.weekendTitle}><span>THE WEEKEND EDIT</span><h2>Room to wander.</h2><p>Stories for when you have time to follow your curiosity wherever it leads.</p></div>
      <Link className={s.weekendLead} to={`/article/${stories[2].id}`}><img src={stories[2].image} alt={stories[2].title} loading="lazy" /><div><span>TRAVEL</span><h3>{stories[2].title}</h3><p>{stories[2].description}</p></div></Link>
      {[stories[9], stories[16]].map((story) => <Link className={s.weekendCard} to={`/article/${story.id}`} key={story.id}><img src={story.image} alt="" loading="lazy" /><div><span>{story.category}</span><h3>{story.title}</h3><small>{story.time}</small></div></Link>)}
    </section>

    <section className={s.readerPulse}>
      <div className={s.bigSectionHeading}>
        <div><span>READER PULSE</span><h2>What the community is saying</h2></div>
        <Link to="/signup">Enter the Reader Room <Icon name="arrow" size={15} /></Link>
      </div>
      <div className={s.voiceGrid}>{readerVoices.map((reader, index) => <article className={s.voiceCard} key={reader.name}>
        <Link className={s.voiceImage} to={`/article/${reader.story.id}`}><img src={reader.story.image} alt="" loading="lazy" /><span>{reader.story.category}</span></Link>
        <div className={s.voicePerson}><i>{reader.initials}</i><div><strong>{reader.name}</strong><small>{reader.place} · Reader</small></div><span><b /> ONLINE</span></div>
        <blockquote>“{reader.quote}”</blockquote>
        <Link className={s.voiceThread} to={`/article/${reader.story.id}`}><Icon name="messages" size={14} /> Join {26 + index * 13} contributions <Icon name="right" size={13} /></Link>
      </article>)}</div>
    </section>

    <section className={s.lensSection}>
      <div className={s.lensIntro}><span>CHOOSE YOUR LENS</span><h2>One world.<br />Many ways in.</h2><p>Follow the subjects that move you, surprise you, or make you see the familiar differently.</p></div>
      {[stories[12], stories[14], stories[17], stories[16]].map((story) => <Link to={`/category/${story.category.toLowerCase()}`} className={s.lensCard} key={story.id}>
        <img src={story.image} alt="" loading="lazy" /><div><span>EXPLORE</span><h3>{story.category}</h3><p>{story.description}</p><Icon name="arrow" size={18} /></div>
      </Link>)}
    </section>

    <section className={s.communityCta}>
      <div className={s.communityFaces}><span>MR</span><span>LC</span><span>DO</span><span>TW</span><i>2,000+ readers</i></div>
      <div><span>THE READER ROOM</span><h2>The story doesn’t end at the article.</h2><p>Ask better questions, exchange perspectives, and join thoughtful conversations with readers around the world.</p></div>
      <Link to="/signup">Join the conversation <Icon name="arrow" size={16} /></Link>
    </section>

    <Newsletter wide />
  </>
}
