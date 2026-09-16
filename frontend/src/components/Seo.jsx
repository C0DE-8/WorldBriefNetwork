import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { categories, stories } from '../data/stories'

const SITE_NAME = 'WorldBriefNetwork'
const MOTTO = 'Know your world. Lead the conversation.'
const DEFAULT_DESCRIPTION = 'Independent news, ideas, and global perspectives to help you know your world and lead the conversation.'

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function removeMeta(attribute, key) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove()
}

function pageDetails(pathname, search) {
  const articleId = pathname.match(/^\/article\/([^/]+)$/)?.[1]
  const story = stories.find((item) => item.id === articleId)
  if (story) return {
    title: `${story.title} | ${SITE_NAME}`,
    description: story.description,
    image: story.image,
    type: 'article',
    story,
  }

  const categorySlug = pathname.match(/^\/category\/([^/]+)$/)?.[1]
  const category = categories.find((item) => item.toLowerCase() === categorySlug)
  if (category) return {
    title: `${category} News & Perspectives | ${SITE_NAME}`,
    description: `The latest ${category.toLowerCase()} stories, analysis, and global perspectives from ${SITE_NAME}.`,
    type: 'website',
  }

  if (pathname === '/') return {
    title: `${SITE_NAME} — ${MOTTO}`,
    description: DEFAULT_DESCRIPTION,
    image: stories[0].image,
    type: 'website',
  }

  const query = new URLSearchParams(search).get('q')
  const pages = {
    '/about': [`About ${SITE_NAME}`, `Discover ${SITE_NAME}, an independent publication bringing context and human perspective to the stories shaping our world.`],
    '/contact': [`Contact ${SITE_NAME}`, `Contact the ${SITE_NAME} editorial team.`],
    '/newsletter': [`The Daily Brief Newsletter | ${SITE_NAME}`, 'Essential stories and fresh global perspectives, delivered in one concise daily briefing.'],
    '/privacy': [`Privacy Policy | ${SITE_NAME}`, `Read the ${SITE_NAME} privacy policy.`],
    '/trending': [`Trending News & Stories | ${SITE_NAME}`, 'The stories and ideas readers are following now, curated by WorldBriefNetwork.'],
    '/saved': [`Saved Stories | ${SITE_NAME}`, 'Your saved WorldBriefNetwork stories.'],
    '/search': [query ? `Search results for “${query}” | ${SITE_NAME}` : `Search | ${SITE_NAME}`, query ? `Search results for ${query} on ${SITE_NAME}.` : `Search news, ideas, and perspectives from ${SITE_NAME}.`],
    '/login': [`Sign in | ${SITE_NAME}`, 'Sign in to your WorldBriefNetwork reader account.'],
    '/signup': [`Join the conversation | ${SITE_NAME}`, 'Create a WorldBriefNetwork reader account to comment, reply, and save stories.'],
  }
  const [title, description] = pages[pathname] || [`Page not found | ${SITE_NAME}`, 'The requested page could not be found.']
  return { title, description, type: 'website', noIndex: ['/saved', '/search', '/login', '/signup'].includes(pathname) || !pages[pathname] }
}

export default function Seo() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    const details = pageDetails(pathname, search)
    const origin = window.location.origin
    const canonicalPath = pathname === '/search' ? '/search' : pathname
    const canonical = new URL(canonicalPath, origin).href
    const image = details.image || new URL('/worldbrief-social.jpg', origin).href

    document.title = details.title
    document.documentElement.lang = 'en'
    setMeta('name', 'description', details.description)
    setMeta('name', 'robots', details.noIndex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    setMeta('name', 'author', details.story?.author || SITE_NAME)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:locale', 'en_US')
    setMeta('property', 'og:type', details.type)
    setMeta('property', 'og:title', details.title)
    setMeta('property', 'og:description', details.description)
    setMeta('property', 'og:url', canonical)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:image:alt', details.story?.title || `${SITE_NAME} logo`)
    if (details.story) {
      removeMeta('property', 'og:image:width')
      removeMeta('property', 'og:image:height')
    } else {
      setMeta('property', 'og:image:width', '1200')
      setMeta('property', 'og:image:height', '630')
    }
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', details.title)
    setMeta('name', 'twitter:description', details.description)
    setMeta('name', 'twitter:image', image)
    setMeta('name', 'twitter:image:alt', details.story?.title || `${SITE_NAME} logo`)
    if (details.story) {
      setMeta('property', 'article:published_time', '2026-09-15T08:00:00-07:00')
      setMeta('property', 'article:modified_time', '2026-09-15T08:00:00-07:00')
      setMeta('property', 'article:section', details.story.category)
      setMeta('property', 'article:author', details.story.author)
    } else {
      removeMeta('property', 'article:published_time')
      removeMeta('property', 'article:modified_time')
      removeMeta('property', 'article:section')
      removeMeta('property', 'article:author')
    }

    let canonicalLink = document.head.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonical)

    const organization = {
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: SITE_NAME,
      url: `${origin}/`,
      logo: { '@type': 'ImageObject', url: new URL('/logo.png', origin).href },
      slogan: MOTTO,
    }
    const schema = details.story ? {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: details.story.title,
      description: details.story.description,
      image: [details.story.image],
      datePublished: '2026-09-15T08:00:00-07:00',
      dateModified: '2026-09-15T08:00:00-07:00',
      author: [{ '@type': 'Person', name: details.story.author }],
      publisher: organization,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      articleSection: details.story.category,
      isAccessibleForFree: true,
    } : {
      '@context': 'https://schema.org',
      '@graph': [organization, {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: SITE_NAME,
        url: `${origin}/`,
        description: DEFAULT_DESCRIPTION,
        publisher: { '@id': `${origin}/#organization` },
        inLanguage: 'en',
      }],
    }

    let script = document.head.querySelector('#seo-structured-data')
    if (!script) {
      script = document.createElement('script')
      script.id = 'seo-structured-data'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(schema)
    window.scrollTo(0, 0)
  }, [pathname, search])

  return null
}
