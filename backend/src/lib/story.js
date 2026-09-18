function mapStory(row) {
  let body = row.body_json
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = [] }
  }
  return {
    id: row.slug,
    databaseId: row.id,
    slug: row.slug,
    category: row.category,
    title: row.title,
    description: row.description,
    image: row.image_url,
    imageCaption: row.image_caption,
    imageCredit: row.image_credit,
    author: row.author,
    authorSlug: row.author_slug,
    time: `${row.reading_minutes} min read`,
    readingMinutes: row.reading_minutes,
    location: row.location,
    body: body || [],
    publishedAt: row.published_at,
    commentCount: Number(row.comment_count || 0),
    saved: Boolean(row.saved),
  }
}

const storySelect = `
  SELECT s.*, c.name category, c.slug category_slug, a.name author, a.slug author_slug,
    (SELECT COUNT(*) FROM comments cm WHERE cm.story_id=s.id AND cm.status='approved') comment_count`

module.exports = { mapStory, storySelect }
