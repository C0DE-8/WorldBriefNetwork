# WorldBriefNetwork API

Express + MySQL (`mysql2`) backend for the WorldBriefNetwork React app.

## Setup

```bash
cp .env.example .env
npm install
npm run db:setup
npm run admin:create -- admin@example.com "use-a-long-password" "Admin Name"
npm run dev
```

The migration command creates `DB_NAME` when the configured MySQL user has permission, records applied files in `schema_migrations`, and can safely be run again. The seed command is idempotent and imports the 20 stories, 8 categories, authors, homepage collections, roles, and sample discussion currently represented by the frontend.

phpMyAdmin is only a database UI; configure the API and phpMyAdmin to use the same MySQL host, port, database, and credentials. Then browse the `worldbriefnet` database (or the value of `DB_NAME`) in phpMyAdmin.

## Commands

- `npm run migrate` — apply pending files from `migrations/`
- `npm run seed` — upsert initial frontend content
- `npm run db:setup` — migrate and seed
- `npm run admin:create -- EMAIL PASSWORD NAME` — create/update the first super admin
- `npm run dev` — development server on port 4000 by default
- `npm start` — normal server start

The frontend uses `VITE_API_URL`, defaulting to `http://localhost:4000/api/v1`.
