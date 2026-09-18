const crypto = require('node:crypto')
const bcrypt = require('bcryptjs')
const { pool } = require('../src/db')

const categories = ['World', 'Politics', 'Business', 'Technology', 'Culture', 'Science', 'Lifestyle', 'Sports']
const storyRows = [
  ['cities-of-tomorrow','World','The cities of tomorrow are being built today','From greener skylines to smarter streets, a new generation of urban thinkers is reimagining how we live together.','photo-1511818966892-d7d671e672a2','Alex Morgan',8,'GLOBAL PERSPECTIVES'],
  ['ai-next-chapter','Technology','Beyond the hype: the next chapter of artificial intelligence','The conversation is shifting from what AI can do to what it should do.','photo-1677442136019-21780ecad995','Sarah Chen',6,null],
  ['slower-travel','Lifestyle','The art of slowing down: a new way to see the world','Less rushing. More discovering. Why the journey deserves our attention.','photo-1476514525535-07fb3b4ae5f1','Emma Wilson',5,null],
  ['clean-energy','Science','A quieter revolution in clean energy is gathering pace','The ideas bringing a more sustainable future within reach.','photo-1473341304170-971dccb5ac1e','Daniel Brooks',7,null],
  ['creative-cities','Culture','Inside the creative spaces bringing communities together','Meet the people giving old spaces a new purpose.','photo-1579783902614-a3fb3927b6a5','Olivia James',4,null],
  ['new-economy','Business','The small businesses thinking bigger about the future','Independent ideas are reshaping the places we work and shop.','photo-1486406146926-c627a92ad1ab','Michael Reed',6,null],
  ['ocean-stories','World','What the ocean can teach us about a connected world','Looking beneath the surface of our most important shared resource.','photo-1518837695005-2083093ee35b','Alex Morgan',9,null],
  ['future-democracy','Politics','A seat at the table: rethinking participation in public life','How local conversations can lead to meaningful change.','photo-1529107386315-e1a2ed48a620','Sofia Alvarez',7,null],
  ['beyond-finish-line','Sports','Beyond the finish line: finding a different kind of victory','For a growing community of runners, showing up is the real achievement.','photo-1552674605-db6ffd4facb5','James Carter',5,null],
  ['everyday-design','Culture','Good design is hiding in the everyday','Finding extraordinary thought in the ordinary things around us.','photo-1494438639946-1ebd1d20bf85','Olivia James',4,null],
  ['human-technology','Technology','Making room for a more human kind of technology','A fresh look at the relationship between our lives and our screens.','photo-1496181133206-80ce9b88a853','Sarah Chen',6,null],
  ['wild-places','Science','The wild places worth protecting, and the people protecting them','A closer look at the landscapes that connect us to nature.','photo-1441974231531-c6227db76b6e','Daniel Brooks',8,null],
  ['farms-after-rain','Science','The farms learning to thrive after the rain stops','New ideas are helping growers adapt to a less predictable climate.','photo-1500937386664-56d1dfef3854','Maya Okafor',7,null],
  ['night-train-return','Lifestyle','Why the night train is making a quiet return','Across Europe, a slower and more social way to travel is gathering momentum.','photo-1473445361085-b9a07f55608b','Emma Wilson',6,null],
  ['chip-race','Business','Inside the global race to build the next generation of chips','Small components are driving some of the world’s biggest investments.','photo-1518770660439-4636190af475','Michael Reed',8,null],
  ['young-voters','Politics','The local issues bringing young voters into public life','Housing, transport, and public space are reshaping political participation.','photo-1521295121783-8a321d551ad2','Sofia Alvarez',7,null],
  ['new-football-cities','Sports','The new football cities changing the shape of the game','New clubs and new audiences are building a different sporting map.','photo-1526232761682-d26e03ac148e','James Carter',5,null],
  ['museum-without-walls','Culture','The museum without walls is coming to your neighborhood','Artists and curators are taking exhibitions into the streets.','photo-1564399579883-451a5d44ec08','Olivia James',4,null],
  ['weather-from-space','Technology','A clearer forecast is arriving from space','Smaller satellites are transforming how communities prepare for extreme weather.','photo-1451187580459-43490279c0fa','Sarah Chen',6,null],
  ['rivers-reimagined','World','The cities learning to live with their rivers again','Restored waterways are becoming a new kind of civic infrastructure.','photo-1518005020951-eccb494ad742','Alex Morgan',9,null],
]

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=85`
const defaultBody = (title, description) => [
  `${description} This editorial preview explores the questions behind “${title.toLowerCase()}” and the everyday experiences that make them worth asking.`,
  'Look past the headlines and a more nuanced picture emerges. Individual choices, shared spaces, and the ways people work together all shape the stories we tell about a changing world.',
  'There are rarely simple answers. Understanding a subject means listening to different perspectives, questioning assumptions, and paying attention to the details that can disappear in a fast-moving conversation.',
  'Our ambition at WorldBriefNetwork is to make room for that curiosity. This is a sample feature created to preview the publication’s reading experience; it is not a reported news article.',
]

async function upsertId(connection, table, key, value, extra = {}) {
  const [rows] = await connection.execute(`SELECT id FROM ${table} WHERE ${key}=?`, [value])
  if (rows[0]) return rows[0].id
  const id = crypto.randomUUID()
  const columns = ['id', key, ...Object.keys(extra)]
  await connection.execute(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`, [id, value, ...Object.values(extra)])
  return id
}

async function main() {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const roleIds = {}
    for (const role of ['reader','contributor','editor','moderator','newsletter_manager','admin','super_admin']) {
      roleIds[role] = await upsertId(connection, 'roles', 'role_key', role, { name: role.replaceAll('_', ' ') })
    }
    const categoryIds = {}
    for (const [index, name] of categories.entries()) categoryIds[name] = await upsertId(connection, 'categories', 'slug', slugify(name), { name, nav_order: index + 1 })
    const authorIds = {}
    for (const name of [...new Set(storyRows.map((row) => row[5]))]) authorIds[name] = await upsertId(connection, 'authors', 'slug', slugify(name), { name })

    const storyIds = {}
    for (const [slug, category, title, description, photoId, author, minutes, location] of storyRows) {
      const [found] = await connection.execute('SELECT id FROM stories WHERE slug=?', [slug])
      const id = found[0]?.id || crypto.randomUUID()
      storyIds[slug] = id
      const body = slug === 'cities-of-tomorrow' ? [
        'A city is more than its skyline. It is the walk to a neighborhood café, the shade of a tree at a bus stop, and the places where strangers become neighbors. Thinking about the cities of tomorrow begins with these ordinary moments.',
        'Architects and urban planners are exploring a different question: what happens when we design around daily life? Mixed-use neighborhoods, welcoming public spaces, and buildings that adapt to changing needs offer a starting point.',
        'The challenge is to make those ideas work for the people already living there. A greener street should also be an accessible street. New housing should create room for different generations, incomes, and ways of life.',
        'There is no single blueprint for a better city. The most interesting possibilities emerge when residents have a meaningful voice in shaping the places they call home.',
      ] : defaultBody(title, description)
      await connection.execute(
        `INSERT INTO stories (id,slug,title,description,body_json,image_url,image_credit,category_id,author_id,location,reading_minutes,status,featured,published_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),body_json=VALUES(body_json),image_url=VALUES(image_url),category_id=VALUES(category_id),author_id=VALUES(author_id),location=VALUES(location),reading_minutes=VALUES(reading_minutes)`,
        [id, slug, title, description, JSON.stringify(body), image(photoId), 'Unsplash · Editorial illustration', categoryIds[category], authorIds[author], location, minutes, 'published', storyRows.indexOf(storyRows.find((r) => r[0] === slug)) < 5, '2026-09-15 12:00:00'],
      )
    }

    const sections = [
      ['featured','carousel','The front page',0,storyRows.slice(0,5).map((r) => r[0])],
      ['latest','story_grid','Stories shaping today',1,storyRows.slice(3).map((r) => r[0])],
      ['most-read','ranked','Most read this week',2,['ai-next-chapter','ocean-stories','clean-energy','everyday-design','beyond-finish-line']],
    ]
    for (const [key,type,title,position,slugs] of sections) {
      const sectionId = await upsertId(connection, 'home_sections', 'section_key', key, { section_type: type, title, position })
      for (const [itemPosition, slug] of slugs.entries()) {
        await connection.execute(
          `INSERT INTO home_section_items (id,section_id,story_id,position) VALUES (?,?,?,?)
           ON DUPLICATE KEY UPDATE story_id=VALUES(story_id)`,
          [crypto.randomUUID(), sectionId, storyIds[slug], itemPosition],
        )
      }
    }

    const demoUsers = [
      ['Maya R.','maya.seed@worldbrief.local'],['Theo K.','theo.seed@worldbrief.local'],
      ['Lina Chen','lina.seed@worldbrief.local'],['David O.','david.seed@worldbrief.local'],
    ]
    const userIds = {}
    const unusablePassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12)
    for (const [name,email] of demoUsers) {
      const [found] = await connection.execute('SELECT id FROM users WHERE email=?', [email])
      const id = found[0]?.id || crypto.randomUUID()
      userIds[name] = id
      await connection.execute('INSERT IGNORE INTO users (id,email,password_hash,display_name,email_verified_at) VALUES (?,?,?,?,UTC_TIMESTAMP())', [id,email,unusablePassword,name])
      await connection.execute('INSERT IGNORE INTO user_roles (user_id,role_id) VALUES (?,?)', [id,roleIds.reader])
    }
    const seedComments = [
      ['seed-1','Maya R.','The most interesting part for me is how this changes ordinary daily life. I would love to hear what readers in other cities are seeing.',24,null],
      ['seed-r1','Theo K.','That is exactly what stood out to me too. The local details are where these big ideas become real.',8,'seed-1'],
      ['seed-2','Lina Chen','A useful piece of context. The question I am left with is who gets invited into the decisions early enough to shape the outcome.',39,null],
      ['seed-3','David O.','There is a hopeful idea here, but the implementation will matter just as much as the ambition.',17,null],
    ]
    for (const [id,name,body,likes,parent] of seedComments) {
      await connection.execute('INSERT IGNORE INTO comments (id,story_id,user_id,author_name_snapshot,parent_id,body,status) VALUES (?,?,?,?,?,?,?)', [id,storyIds['cities-of-tomorrow'],userIds[name],name,parent,body,'approved'])
      for (let i=0;i<likes;i++) {
        const reactionEmail = `seed-${id}-${i}@worldbrief.local`
        const [existingReactionUsers] = await connection.execute('SELECT id FROM users WHERE email=?', [reactionEmail])
        const reactionUser = existingReactionUsers[0]?.id || crypto.randomUUID()
        await connection.execute('INSERT IGNORE INTO users (id,email,password_hash,display_name,email_verified_at) VALUES (?,?,?,?,UTC_TIMESTAMP())', [reactionUser,reactionEmail,unusablePassword,`Seed Reader ${i+1}`])
        await connection.execute('INSERT IGNORE INTO comment_reactions (comment_id,user_id) VALUES (?,?)', [id,reactionUser])
      }
    }
    await connection.commit()
    process.stdout.write(`Seed complete: ${storyRows.length} stories, ${categories.length} categories.\n`)
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
    await pool.end()
  }
}

main().catch((error) => { console.error(`Seed failed: ${error.message}`); process.exit(1) })
