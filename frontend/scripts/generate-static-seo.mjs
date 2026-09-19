import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const outputDirectory = resolve('dist')
const shell = await readFile(resolve(outputDirectory, 'index.html'), 'utf8')
const apiUrl = (process.env.VITE_API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '')
let stories = []
try {
  const response = await fetch(`${apiUrl}/stories?limit=100`)
  if (!response.ok) throw new Error(`API returned ${response.status}`)
  stories = (await response.json()).data
} catch (error) {
  console.warn(`Static article metadata skipped: ${error.message}`)
}

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

function replaceMeta(html, attribute, key, content) {
  const escaped = escapeHtml(content)
  const pattern = new RegExp(`<meta ${attribute}="${key}" content="[^"]*"\\s*\/?>`)
  const tag = `<meta ${attribute}="${key}" content="${escaped}" />`
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

for (const story of stories) {
  const title = `${story.title} | WorldBriefNetwork`
  let html = shell.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
  html = replaceMeta(html, 'name', 'description', story.description)
  html = replaceMeta(html, 'name', 'author', story.author)
  html = replaceMeta(html, 'property', 'og:type', 'article')
  html = replaceMeta(html, 'property', 'og:title', title)
  html = replaceMeta(html, 'property', 'og:description', story.description)
  html = replaceMeta(html, 'property', 'og:image', story.image)
  html = replaceMeta(html, 'property', 'og:image:alt', story.title)
  html = replaceMeta(html, 'name', 'twitter:title', title)
  html = replaceMeta(html, 'name', 'twitter:description', story.description)
  html = replaceMeta(html, 'name', 'twitter:image', story.image)
  html = replaceMeta(html, 'name', 'twitter:image:alt', story.title)
  html = html.replace(/\s*<meta property="og:image:(?:width|height)"[^>]*>/g, '')

  const articleMeta = [
    `<meta property="article:published_time" content="${story.publishedAt}" />`,
    `<meta property="article:modified_time" content="${story.publishedAt}" />`,
    `<meta property="article:section" content="${escapeHtml(story.category)}" />`,
    `<meta property="article:author" content="${escapeHtml(story.author)}" />`,
  ].join('\n    ')
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.title,
    description: story.description,
    image: [story.image],
    datePublished: story.publishedAt,
    dateModified: story.publishedAt,
    author: [{ '@type': 'Person', name: story.author }],
    publisher: { '@type': 'Organization', name: 'WorldBriefNetwork' },
    articleSection: story.category,
    isAccessibleForFree: true,
  }).replaceAll('<', '\\u003c')
  html = html.replace('</head>', `    ${articleMeta}\n    <script type="application/ld+json">${schema}</script>\n  </head>`)

  const directory = resolve(outputDirectory, 'article', story.id)
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, 'index.html'), html)
}

console.log(`Generated static metadata pages for ${stories.length} articles.`)
