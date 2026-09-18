# WorldBriefNetwork Backend Requirements

Status: implementation blueprint  
Source audited: current React frontend in `frontend/src`  
Recommended database: PostgreSQL 16+

## 1. Purpose

The current frontend is a working browser-only prototype. Articles come from `frontend/src/data/stories.js`, while accounts, sessions, bookmarks, newsletter preferences, contact drafts, comments, replies, and reactions are stored in component state or `localStorage`.

This document defines the backend needed to make every current public and reader-facing feature production-ready, and adds the admin/editorial functions required to operate the publication without editing source code.

## 2. Current frontend routes and required backend support

| Frontend route | Audience | Backend requirement |
|---|---|---|
| `/` | Public | Homepage composition, live briefs, featured stories, sections, trending topics, most-read stories, reader highlights |
| `/category/:category` | Public | Published stories filtered by category, pagination, sorting |
| `/article/:id` | Public | Published article by slug, author/category/media, related stories, view event, conversation totals |
| `/search?q=` | Public | Full-text search over title, summary, body, category, tags, and author; filters, sorting, pagination |
| `/trending` | Public | Stories ranked by recent engagement plus optional editorial overrides |
| `/about` | Public | CMS-managed static page |
| `/contact` | Public | Validated contact submission, anti-spam controls, admin inbox |
| `/newsletter` | Public | Newsletter subscribe, confirm, unsubscribe, and preference management |
| `/signup` | Guest | Reader registration and email verification |
| `/login` | Guest | Secure authentication and session creation |
| `/forgot-password` | Guest | Email-based reset request and one-use reset token flow |
| `/saved` | Reader | Authenticated bookmark list, pagination, remove bookmark |
| Article conversation | Public/Reader | Public approved comments; authenticated create/reply/react/report actions |
| `/privacy` | Public | CMS-managed privacy page and privacy/data controls |
| Admin routes | Staff only | Dashboard, editorial CMS, moderation, users, newsletter, contacts, media, settings, audit history |

Unknown routes and unpublished/deleted article slugs must return a real HTTP `404`, not a successful page containing “not found.”

## 3. Roles and permissions

Use role-based access control. A user can have one or more roles.

| Role | Main permissions |
|---|---|
| `reader` | Manage own profile, sessions, bookmarks, comments, reactions, reports, and privacy requests |
| `contributor` | Create and edit own drafts, submit for review, access own media |
| `editor` | Edit all content, manage categories/tags/authors/media, review and schedule stories, manage homepage |
| `moderator` | Review/hide/restore comments, resolve reports, suspend reader participation |
| `newsletter_manager` | Manage subscribers, segments, campaigns, templates, and delivery reports |
| `admin` | Manage users/roles, contacts, settings, all editorial/moderation functions |
| `super_admin` | All permissions, including admin assignment and sensitive system configuration |

Rules:

- Public APIs expose only published content and approved comments.
- Contributors cannot publish unless explicitly granted that permission.
- Only admins can change staff roles; only super admins can grant `admin` or `super_admin`.
- Suspended or banned accounts cannot comment, reply, or react.
- Every admin mutation must write an audit log entry.

## 4. Recommended backend architecture

- Node.js API service (Express, Fastify, or NestJS) using TypeScript.
- PostgreSQL as the source of truth.
- Redis for rate limits, cache, short-lived jobs, and optional live-reader presence.
- Object storage plus CDN for uploaded images and generated variants.
- Background worker/queue for email, image processing, scheduled publishing, search indexing, and analytics aggregation.
- Transactional email provider for verification, password reset, newsletter confirmation, contact acknowledgements, and account security alerts.
- REST API under `/api/v1`; JSON responses and UTC ISO-8601 timestamps.
- OpenAPI documentation generated and kept in CI.

The API can initially use PostgreSQL full-text search. A dedicated search engine should only be added after search volume or relevance requirements justify it.

## 5. Public API

### 5.1 Site and homepage

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/site/bootstrap` | Site name, edition, navigation, categories, public settings, current user summary when authenticated |
| `GET` | `/api/v1/home` | Entire active homepage composition in one cacheable response |
| `GET` | `/api/v1/pages/:slug` | Published static page such as about, privacy, or community guidelines |
| `GET` | `/api/v1/live-briefs` | Active ticker items ordered by position |
| `GET` | `/api/v1/topics/trending` | Active editorial and/or calculated trending topics |

`GET /home` should return named sections rather than hard-coded article array positions. Each section contains its display type, heading/copy, ordered story references, and optional CTA. Required current sections include featured carousel/headlines, latest, long read, spotlight, quick reads, newsroom desks, ideas lab, global briefing, most read, world window, culture, weekend edit, reader pulse, lens/categories, reader-room promotion, and newsletter promotion.

### 5.2 Stories, categories, authors, and search

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/stories` | Published story listing with filters and cursor pagination |
| `GET` | `/api/v1/stories/:slug` | Full published story and related content |
| `GET` | `/api/v1/stories/:slug/related` | Related published stories |
| `GET` | `/api/v1/categories` | Active categories in navigation order |
| `GET` | `/api/v1/categories/:slug` | Category details and published stories |
| `GET` | `/api/v1/authors/:slug` | Public author profile and stories |
| `GET` | `/api/v1/search` | Full-text search |
| `GET` | `/api/v1/trending` | Engagement-ranked stories |
| `POST` | `/api/v1/stories/:slug/view` | Record a deduplicated view/read event |
| `POST` | `/api/v1/stories/:slug/share` | Record a share intent by channel |

Supported story-list query parameters:

- `category`, `tag`, `author`, `region`, `format`, `status` (public API always forces published).
- `sort=latest|featured|shortest|title|trending`.
- `limit` with a server maximum and opaque `cursor`.
- Search: `q`, optional category/tag/date filters, `sort=relevance|latest|shortest|title`.

Article response must include: slug, title, dek/description, body blocks or sanitized HTML, hero image/caption/credit/alt text, category, tags, author, region/location, format, reading minutes, publish/update timestamps, SEO fields, bookmark state for the current user, comment count, and related stories.

Only count a story view after a reasonable threshold (for example 10 seconds or meaningful scroll), and deduplicate by session/user plus time window. Do not trust client-supplied totals.

### 5.3 Authentication and account

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Guest | Create reader account; send verification email |
| `POST` | `/api/v1/auth/login` | Guest | Verify credentials; create session |
| `POST` | `/api/v1/auth/logout` | User | Revoke current session |
| `POST` | `/api/v1/auth/logout-all` | User | Revoke all sessions |
| `POST` | `/api/v1/auth/refresh` | Refresh token | Rotate session/refresh token |
| `POST` | `/api/v1/auth/verify-email` | Token | Consume verification token |
| `POST` | `/api/v1/auth/resend-verification` | Guest | Resend with anti-abuse controls |
| `POST` | `/api/v1/auth/forgot-password` | Guest | Always return a neutral response; email token if account exists |
| `POST` | `/api/v1/auth/reset-password` | Reset token | Set password and revoke existing sessions |
| `GET` | `/api/v1/me` | User | Current profile, roles, preferences, counts |
| `PATCH` | `/api/v1/me` | User | Update display name, avatar, bio, location |
| `PUT` | `/api/v1/me/password` | User | Change password after current-password check |
| `GET` | `/api/v1/me/sessions` | User | List active devices/sessions |
| `DELETE` | `/api/v1/me/sessions/:id` | User | Revoke a session |
| `POST` | `/api/v1/me/export` | User | Request privacy data export |
| `DELETE` | `/api/v1/me` | User | Confirm and queue account deletion/anonymization |

Authentication requirements:

- Hash passwords with Argon2id (preferred) or bcrypt using a current safe work factor; never SHA-256 passwords.
- Prefer secure, `HttpOnly`, `SameSite=Lax` cookies. If cross-site deployment requires it, use `SameSite=None; Secure` plus strict CORS and CSRF protection.
- Rotate refresh tokens, store only token hashes, detect reuse, and revoke the affected token family.
- Normalize email for lookup and enforce a case-insensitive unique constraint.
- Rate-limit registration, login, resend, and reset requests by account and IP.
- Require 8+ characters at minimum; allow password managers and long passwords.
- Optional later features: OAuth identities and MFA. The schema below leaves room for both.

### 5.4 Bookmarks / saved stories

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/me/bookmarks` | Reader | Paginated saved stories |
| `PUT` | `/api/v1/me/bookmarks/:storyId` | Reader | Idempotently save story |
| `DELETE` | `/api/v1/me/bookmarks/:storyId` | Reader | Remove saved story |

Guests may keep temporary local bookmarks, but after login the frontend should offer/perform a one-time merge into the account. A unique `(user_id, story_id)` key prevents duplicates.

### 5.5 Conversations

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/stories/:storyId/comments` | Public | Approved top-level comments and replies; `sort=top|latest` |
| `POST` | `/api/v1/stories/:storyId/comments` | Reader | Create top-level comment |
| `POST` | `/api/v1/comments/:id/replies` | Reader | Create one-level reply |
| `PATCH` | `/api/v1/comments/:id` | Owner | Edit during configured window |
| `DELETE` | `/api/v1/comments/:id` | Owner | Soft-delete own comment |
| `PUT` | `/api/v1/comments/:id/reaction` | Reader | Idempotently add reaction |
| `DELETE` | `/api/v1/comments/:id/reaction` | Reader | Remove reaction |
| `POST` | `/api/v1/comments/:id/report` | Reader | Report comment with reason/details |
| `GET` | `/api/v1/stories/:storyId/presence` | Public | Optional approximate active-reader count |

Conversation rules:

- Current UI supports only one reply level. Enforce `parent_id` as a top-level comment or adapt UI before permitting deeper nesting.
- Store one reaction per user/comment/type; counts are computed or maintained safely on the server.
- Sanitize input, render as escaped plain text, enforce the UI limits (1,000 characters for comments, 500 for replies), and rate-limit posting.
- New comments may be immediately approved, held by rules, or sent to moderation depending on trust level and site settings.
- Hidden/deleted content must not disappear in a way that breaks reply threads; return a tombstone when needed.
- “Top” ranking should combine reaction count and time decay, not accept a client-provided score.

### 5.6 Newsletter

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/newsletter/subscriptions` | Upsert pending subscriber and send double-opt-in email |
| `GET` | `/api/v1/newsletter/confirm` | Consume signed confirmation token and activate subscription |
| `POST` | `/api/v1/newsletter/unsubscribe` | Unsubscribe through signed link or authenticated account |
| `GET` | `/api/v1/newsletter/preferences` | Read preferences using signed management token or login |
| `PATCH` | `/api/v1/newsletter/preferences` | Update edition/topics/frequency/consent |

Store consent evidence: timestamp, policy version, source form, and coarse request metadata. Never expose whether an arbitrary email is subscribed. Process provider webhooks for delivered, bounced, complained, opened, and clicked events with signature verification and idempotency.

### 5.7 Contact, privacy, and uploads

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/contact` | Public | Submit enquiry/story idea/partnership/correction |
| `POST` | `/api/v1/privacy/requests` | User or verified email | Access, deletion, correction, or objection request |
| `GET` | `/api/v1/media/:id` | Public when published | Media metadata/redirect as appropriate |

Contact validation: name 2–100 characters, valid email, enumerated subject, message 10–10,000 characters. Add honeypot/time checks, IP/email rate limits, optional CAPTCHA after suspicious activity, spam scoring, and an acknowledgement email. Do not expose contact messages through public endpoints.

## 6. Admin application and APIs

All `/api/v1/admin/**` routes require staff authentication, explicit permissions, CSRF protection when cookie-authenticated, and audit logging.

### 6.1 Dashboard

- Publishing status: drafts, in review, scheduled, published today, failed jobs.
- Engagement: story views, reads, bookmarks, comments, shares, trending stories.
- Community: pending comments, open reports, suspended accounts.
- Newsletter: active subscribers, pending confirmations, recent sends, bounce/complaint rates.
- Contact inbox: unread and unresolved messages by subject.
- Recent staff activity and system/job failures.

### 6.2 Editorial CMS

Admin screens and endpoints must support:

- Stories: list/filter, create, edit, preview, autosave drafts, submit for review, approve, schedule, publish, unpublish, archive, duplicate, soft delete, restore, revision history.
- Article fields: title, slug, dek, body blocks, hero media, caption, credit, alt text, category, tags, author(s), region/location, format, reading time override, source/reference notes, canonical URL, SEO title/description/image, social copy, publish/update timestamps, comment policy, featured flags.
- Categories, tags, authors, regions, and story formats: CRUD, ordering, activation, redirects after slug changes.
- Media library: direct-to-storage upload, metadata/alt text/credit/focal point, generated responsive sizes, usage references, archive/delete safeguards.
- Static pages: about, privacy, community guidelines, contact copy, newsletter copy; revisions, preview, scheduling, publishing.
- Homepage builder: ordered sections and ordered items with active windows. Validate that selected stories will be published during the section window.
- Live briefing ticker and trending-topic editor: ordering, target URL/story, active start/end, manual vs calculated mode.
- Redirect manager for changed/deleted article, category, author, and page slugs.

Suggested endpoints:

```text
GET/POST             /api/v1/admin/stories
GET/PATCH/DELETE     /api/v1/admin/stories/:id
POST                 /api/v1/admin/stories/:id/submit
POST                 /api/v1/admin/stories/:id/approve
POST                 /api/v1/admin/stories/:id/schedule
POST                 /api/v1/admin/stories/:id/publish
POST                 /api/v1/admin/stories/:id/unpublish
GET                  /api/v1/admin/stories/:id/revisions
POST                 /api/v1/admin/stories/:id/revisions/:revisionId/restore
GET/POST/PATCH/DELETE /api/v1/admin/categories/:id?
GET/POST/PATCH/DELETE /api/v1/admin/tags/:id?
GET/POST/PATCH/DELETE /api/v1/admin/authors/:id?
GET/POST/PATCH/DELETE /api/v1/admin/pages/:id?
GET/POST/PATCH/DELETE /api/v1/admin/home-sections/:id?
GET/POST/PATCH/DELETE /api/v1/admin/live-briefs/:id?
GET/POST/PATCH/DELETE /api/v1/admin/trending-topics/:id?
GET/POST/PATCH/DELETE /api/v1/admin/media/:id?
POST                 /api/v1/admin/media/upload-url
GET/POST/PATCH/DELETE /api/v1/admin/redirects/:id?
```

Publishing must be transactional. A scheduled job should atomically move due, approved stories to `published`, invalidate relevant caches, update search, rebuild sitemap/feed as needed, and record the actor as the system.

### 6.3 Moderation

- Queue filters: pending, approved, hidden, spam, deleted, reported, story, user, date.
- Approve, hide, mark spam, restore, and soft-delete comments individually or in bulk.
- View report evidence and reporter history; resolve/dismiss reports with internal notes.
- Warn, mute, suspend, ban, or reinstate users with expiry and reason.
- Block terms/patterns and maintain moderation rules.
- Preserve moderation history even after visible content is removed.

### 6.4 User administration

- Search/filter readers and staff by status, role, email verification, date, and participation.
- View profile, sessions, comments, moderation history, bookmarks count, and newsletter state (sensitive data permission required).
- Verify, suspend, anonymize, or initiate deletion.
- Assign/revoke roles according to the role-escalation rules.
- Never show password hashes, raw session tokens, or raw reset tokens.

### 6.5 Newsletter operations

- Subscriber search/export with permission checks and audit log.
- Suppression list, consent history, segments, templates, campaigns, test sends, scheduling, cancellation before send, delivery statistics.
- Campaign content can reference published stories but stores a send-time snapshot so historical emails do not change.
- Provider webhook log and retry/dead-letter handling.

### 6.6 Contact inbox and settings

- Contact messages: status (`new`, `in_progress`, `resolved`, `spam`), assignment, internal notes, response metadata, export.
- Settings: branding, edition/time zone, public URLs, social accounts, registration/comment toggles, moderation mode, email sender details, SEO defaults, analytics consent configuration.
- Secrets belong in a secret manager/environment, never in the settings table or admin response.

## 7. PostgreSQL schema

Conventions:

- Use UUID primary keys (`uuid` or UUIDv7 where supported).
- Use `timestamptz` for all timestamps and store UTC.
- Add `created_at` and `updated_at` to mutable entities.
- Use `citext` or a unique index on `lower(email)` for email uniqueness.
- Prefer lookup tables or checked text values over PostgreSQL enums when operational changes are likely.
- Soft deletion uses `deleted_at`; public queries always exclude deleted rows.
- Foreign-key delete behavior must be explicit. Editorial and audit history should normally be restricted or anonymized, not cascade-deleted.

### 7.1 Identity, access, and privacy

#### `users`

`id uuid PK`, `email citext UNIQUE NOT NULL`, `password_hash text`, `display_name varchar(100) NOT NULL`, `avatar_media_id uuid NULL FK media_assets`, `bio text`, `location varchar(120)`, `status varchar(20) NOT NULL DEFAULT 'active'`, `email_verified_at timestamptz`, `last_login_at timestamptz`, `failed_login_count int DEFAULT 0`, `locked_until timestamptz`, `created_at`, `updated_at`, `deleted_at`.

Checks/statuses: `active`, `suspended`, `banned`, `pending_deletion`, `anonymized`. Password hash may be null only for an OAuth-only account.

#### `roles`

`id uuid PK`, `key varchar(50) UNIQUE`, `name varchar(100)`, `description text`, timestamps.

#### `permissions`

`id uuid PK`, `key varchar(100) UNIQUE`, `description text`.

#### `user_roles`

`user_id uuid FK users`, `role_id uuid FK roles`, `granted_by uuid FK users`, `granted_at timestamptz`, composite PK `(user_id, role_id)`.

#### `role_permissions`

`role_id uuid FK roles`, `permission_id uuid FK permissions`, composite PK.

#### `auth_sessions`

`id uuid PK`, `user_id uuid FK users`, `refresh_token_hash text UNIQUE`, `token_family_id uuid`, `user_agent text`, `ip_hash text`, `last_seen_at`, `expires_at`, `revoked_at`, `revoke_reason`, `created_at`.

Indexes: `(user_id, revoked_at)`, `expires_at`, `token_family_id`.

#### `account_tokens`

`id uuid PK`, `user_id uuid FK users`, `type varchar(30)`, `token_hash text UNIQUE`, `expires_at`, `consumed_at`, `created_at`, `request_ip_hash text`.

Types: `verify_email`, `reset_password`, `change_email`. Index `(user_id, type, consumed_at)` and periodically delete expired rows.

#### `oauth_accounts` (optional initially)

`id uuid PK`, `user_id uuid FK users`, `provider`, `provider_subject`, encrypted minimal provider metadata, timestamps; unique `(provider, provider_subject)`.

#### `user_consents`

`id uuid PK`, `user_id uuid NULL FK users`, `email citext NULL`, `consent_type`, `policy_version`, `granted boolean`, `source`, `ip_hash`, `user_agent`, `created_at`. Append-only.

#### `privacy_requests`

`id uuid PK`, `user_id uuid NULL FK users`, `verified_email citext`, `type`, `status`, `verification_token_hash`, `assigned_to uuid NULL FK users`, `due_at`, `completed_at`, `notes text`, timestamps.

### 7.2 Editorial content

#### `authors`

`id uuid PK`, `user_id uuid NULL UNIQUE FK users`, `name varchar(120)`, `slug varchar(140) UNIQUE`, `title`, `bio`, `avatar_media_id uuid NULL`, `social_links jsonb DEFAULT '{}'`, `is_active boolean`, timestamps, `deleted_at`.

#### `categories`

`id uuid PK`, `name varchar(80)`, `slug varchar(100) UNIQUE`, `description text`, `seo_title`, `seo_description`, `nav_order int`, `is_active boolean`, timestamps, `deleted_at`.

Seed current categories: World, Politics, Business, Technology, Culture, Science, Lifestyle, Sports.

#### `tags`

`id uuid PK`, `name varchar(80)`, `slug varchar(100) UNIQUE`, `description text`, timestamps, `deleted_at`.

#### `regions`

`id uuid PK`, `name varchar(100)`, `slug varchar(120) UNIQUE`, `description`, `is_active`, timestamps.

#### `stories`

`id uuid PK`, `slug varchar(220) UNIQUE NOT NULL`, `title varchar(300) NOT NULL`, `dek text`, `body_json jsonb NOT NULL`, `body_html text`, `category_id uuid FK categories`, `primary_author_id uuid FK authors`, `region_id uuid NULL FK regions`, `format varchar(30) DEFAULT 'article'`, `status varchar(30) NOT NULL DEFAULT 'draft'`, `hero_media_id uuid NULL FK media_assets`, `hero_caption text`, `hero_credit text`, `reading_minutes smallint`, `comments_enabled boolean DEFAULT true`, `featured boolean DEFAULT false`, `seo_title varchar(70)`, `seo_description varchar(170)`, `seo_media_id uuid NULL`, `canonical_url text`, `published_at timestamptz`, `scheduled_at timestamptz`, `first_published_at timestamptz`, `unpublished_at timestamptz`, `created_by uuid FK users`, `updated_by uuid FK users`, `approved_by uuid NULL FK users`, timestamps, `deleted_at`.

Statuses: `draft`, `in_review`, `approved`, `scheduled`, `published`, `unpublished`, `archived`. Validate publication fields before moving to `approved` or `published`.

Indexes:

- Unique partial/canonical slug rule, including redirect creation on change.
- `(status, published_at DESC)`.
- `(category_id, status, published_at DESC)`.
- `(primary_author_id, status, published_at DESC)`.
- GIN full-text index built from weighted title, dek, body, author, category, and tags.

#### `story_authors`

`story_id uuid FK stories`, `author_id uuid FK authors`, `position int`, `role varchar(40)`, composite PK `(story_id, author_id)`.

Use this for multiple bylines; keep `primary_author_id` only if it materially simplifies common queries.

#### `story_tags`

`story_id uuid FK stories`, `tag_id uuid FK tags`, composite PK. Add reverse index `(tag_id, story_id)`.

#### `story_revisions`

`id uuid PK`, `story_id uuid FK stories`, `revision_number int`, `snapshot jsonb`, `change_summary text`, `created_by uuid FK users`, `created_at`; unique `(story_id, revision_number)`.

#### `story_relations`

`story_id uuid FK stories`, `related_story_id uuid FK stories`, `relation_type varchar(30)`, `position int`, `created_by uuid FK users`, timestamps; unique `(story_id, related_story_id, relation_type)` and check that IDs differ.

#### `static_pages`

`id uuid PK`, `slug varchar(160) UNIQUE`, `title`, `body_json jsonb`, `body_html text`, SEO fields, `status`, `published_at`, `scheduled_at`, actor fields, timestamps, `deleted_at`.

#### `page_revisions`

Same revision pattern as `story_revisions`, referencing `static_pages`.

#### `media_assets`

`id uuid PK`, `storage_key text UNIQUE`, `public_url text`, `mime_type`, `byte_size bigint`, `width int`, `height int`, `alt_text text`, `caption text`, `credit text`, `focal_x numeric`, `focal_y numeric`, `status`, `uploaded_by uuid FK users`, `metadata jsonb`, timestamps, `deleted_at`.

#### `media_variants`

`id uuid PK`, `media_id uuid FK media_assets`, `variant_key`, `storage_key UNIQUE`, `width`, `height`, `format`, `byte_size`, timestamps; unique `(media_id, variant_key)`.

#### `slug_redirects`

`id uuid PK`, `from_path text UNIQUE`, `to_path text`, `http_status smallint DEFAULT 301`, `is_active`, `created_by uuid FK users`, timestamps. Prevent redirect loops.

### 7.3 Homepage and curation

#### `home_sections`

`id uuid PK`, `key varchar(80)`, `type varchar(50)`, `title`, `subtitle`, `eyebrow`, `cta_label`, `cta_url`, `settings jsonb DEFAULT '{}'`, `position int`, `starts_at`, `ends_at`, `is_active`, actor fields, timestamps. Unique section key per active composition as appropriate.

#### `home_section_items`

`id uuid PK`, `section_id uuid FK home_sections`, `story_id uuid NULL FK stories`, `category_id uuid NULL FK categories`, `title_override`, `description_override`, `label`, `target_url`, `media_id uuid NULL`, `position int`, `starts_at`, `ends_at`, timestamps; unique `(section_id, position)`.

Require at least one valid target. This replaces every hard-coded `stories[index]` selection in `Home.jsx`.

#### `live_briefs`

`id uuid PK`, `title`, `story_id uuid NULL FK stories`, `target_url`, `position int`, `starts_at`, `ends_at`, `is_active`, actor fields, timestamps.

#### `trending_topics`

`id uuid PK`, `label`, `search_query`, `target_url`, `position int`, `mode varchar(20)`, `score numeric`, `starts_at`, `ends_at`, `is_active`, actor fields, timestamps.

#### `reader_highlights`

`id uuid PK`, `user_id uuid NULL FK users`, `display_name_snapshot`, `location_snapshot`, `story_id uuid FK stories`, `comment_id uuid NULL FK comments`, `quote text`, `position int`, `starts_at`, `ends_at`, `approved_by uuid FK users`, timestamps. Obtain permission before featuring a reader.

### 7.4 Reader engagement and moderation

#### `bookmarks`

`user_id uuid FK users`, `story_id uuid FK stories`, `created_at`; composite PK `(user_id, story_id)`. Index `(user_id, created_at DESC)`.

#### `comments`

`id uuid PK`, `story_id uuid FK stories`, `user_id uuid NULL FK users`, `parent_id uuid NULL FK comments`, `body text NOT NULL`, `status varchar(20) DEFAULT 'pending'`, `reaction_count int DEFAULT 0`, `reply_count int DEFAULT 0`, `moderation_reason text`, `moderated_by uuid NULL FK users`, `moderated_at`, `edited_at`, timestamps, `deleted_at`.

Indexes: `(story_id, status, created_at DESC)`, `(parent_id, status, created_at)`, `(user_id, created_at DESC)`, `(story_id, status, reaction_count DESC, created_at DESC)`.

Never use stored counters as the sole source of truth; update them transactionally and provide a reconciliation job.

#### `comment_reactions`

`comment_id uuid FK comments`, `user_id uuid FK users`, `type varchar(20) DEFAULT 'like'`, `created_at`; composite PK `(comment_id, user_id, type)`. Index `(user_id, created_at DESC)`.

#### `comment_reports`

`id uuid PK`, `comment_id uuid FK comments`, `reporter_user_id uuid FK users`, `reason varchar(40)`, `details text`, `status varchar(20) DEFAULT 'open'`, `resolved_by uuid NULL FK users`, `resolution_note text`, `resolved_at`, timestamps; unique open-report rule per reporter/comment.

#### `moderation_actions`

`id uuid PK`, `comment_id uuid NULL FK comments`, `target_user_id uuid NULL FK users`, `action varchar(40)`, `reason text`, `duration_seconds int`, `actor_user_id uuid FK users`, `metadata jsonb`, `created_at`. Append-only.

#### `user_restrictions`

`id uuid PK`, `user_id uuid FK users`, `type varchar(30)`, `reason`, `starts_at`, `ends_at`, `created_by uuid FK users`, `revoked_at`, `revoked_by uuid NULL FK users`, timestamps.

#### `moderation_rules`

`id uuid PK`, `type`, `pattern`, `action`, `is_active`, `created_by`, timestamps. Treat patterns as sensitive admin data.

### 7.5 Newsletter and contact

#### `newsletter_subscribers`

`id uuid PK`, `user_id uuid NULL FK users`, `email citext UNIQUE NOT NULL`, `status varchar(20)`, `frequency varchar(30)`, `edition varchar(30)`, `source`, `confirmation_token_hash text`, `confirmation_expires_at`, `confirmed_at`, `unsubscribed_at`, `consent_policy_version`, `consent_at`, `last_sent_at`, timestamps.

Statuses: `pending`, `active`, `unsubscribed`, `bounced`, `complained`, `suppressed`.

#### `newsletter_topics`

`id uuid PK`, `name`, `slug UNIQUE`, `is_active`, timestamps.

#### `newsletter_subscriber_topics`

`subscriber_id uuid FK newsletter_subscribers`, `topic_id uuid FK newsletter_topics`, composite PK.

#### `newsletter_templates`

`id uuid PK`, `name`, `subject_template`, `html_template`, `text_template`, `version int`, `is_active`, actor fields, timestamps.

#### `newsletter_campaigns`

`id uuid PK`, `name`, `subject`, `preheader`, `content_snapshot jsonb`, `segment_definition jsonb`, `status`, `scheduled_at`, `started_at`, `completed_at`, `provider_campaign_id`, `created_by`, `approved_by`, timestamps.

#### `newsletter_deliveries`

`id uuid PK`, `campaign_id uuid FK`, `subscriber_id uuid FK`, `provider_message_id text`, `status`, `sent_at`, `delivered_at`, `opened_at`, `clicked_at`, `bounced_at`, `complained_at`, `error_code`, timestamps; unique `(campaign_id, subscriber_id)` and unique provider message ID where present.

#### `email_suppressions`

`id uuid PK`, `email citext`, `reason`, `provider`, `created_at`; unique email or `(email, reason)` according to policy.

#### `contact_messages`

`id uuid PK`, `user_id uuid NULL FK users`, `name varchar(100)`, `email citext`, `subject varchar(40)`, `message text`, `status varchar(20) DEFAULT 'new'`, `spam_score numeric`, `assigned_to uuid NULL FK users`, `resolved_at`, `request_ip_hash`, `user_agent`, timestamps, `deleted_at`.

#### `contact_notes`

`id uuid PK`, `contact_message_id uuid FK`, `body text`, `created_by uuid FK users`, `created_at`, `deleted_at`.

### 7.6 Analytics, system operations, and auditing

#### `story_events`

`id bigint generated PK`, `story_id uuid FK`, `user_id uuid NULL FK`, `anonymous_id_hash text`, `session_id_hash text`, `event_type varchar(30)`, `channel varchar(30)`, `occurred_at timestamptz`, `metadata jsonb`, `ip_hash text`.

Partition by month when volume warrants it. Keep raw event retention limited. Event types include `view`, `qualified_read`, `complete`, `share`, and optional outbound click. Bookmarks/comments/reactions already have normalized source tables and need not be duplicated unless needed for event analytics.

#### `story_daily_metrics`

`story_id uuid FK`, `metric_date date`, `views bigint`, `qualified_reads bigint`, `completions bigint`, `shares bigint`, `bookmarks bigint`, `comments bigint`, `reactions bigint`, `trending_score numeric`, composite PK `(story_id, metric_date)`.

#### `audit_logs`

`id bigint generated PK`, `actor_user_id uuid NULL FK users`, `action varchar(100)`, `entity_type varchar(80)`, `entity_id text`, `before_data jsonb`, `after_data jsonb`, `request_id`, `ip_hash`, `user_agent`, `created_at`. Append-only; redact passwords, tokens, secrets, and unnecessary personal data.

#### `webhook_events`

`id uuid PK`, `provider`, `provider_event_id`, `event_type`, `payload jsonb`, `status`, `attempt_count`, `processed_at`, `last_error`, `received_at`; unique `(provider, provider_event_id)`.

#### `jobs`

Only needed if the selected queue does not persist sufficient job state: `id`, `type`, `payload`, `status`, `run_at`, `attempts`, `max_attempts`, `locked_at`, `last_error`, timestamps.

#### `site_settings`

`key varchar(120) PK`, `value jsonb`, `is_public boolean DEFAULT false`, `updated_by uuid FK users`, `updated_at`. Do not store secrets.

## 8. Data relationships

```text
users ──< bookmarks >── stories ──> categories
  │                       │  ├──< story_tags >── tags
  │                       │  ├──< story_authors >── authors
  │                       │  ├──< comments ──< comment_reactions
  │                       │  │       └──< comment_reports
  │                       │  ├──< story_revisions
  │                       │  └──< story_events ──> story_daily_metrics
  ├──< auth_sessions
  ├──< user_roles >── roles ──< role_permissions >── permissions
  └──< user_consents

home_sections ──< home_section_items >── stories
newsletter_subscribers ──< newsletter_deliveries >── newsletter_campaigns
```

## 9. Response, validation, and error conventions

Use a consistent envelope:

```json
{
  "data": {},
  "meta": { "nextCursor": null, "requestId": "..." }
}
```

Errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields.",
    "fields": { "email": "Enter a valid email address." },
    "requestId": "..."
  }
}
```

Use appropriate HTTP status codes: `400` malformed request, `401` unauthenticated, `403` unauthorized, `404` absent/not public, `409` conflict, `422` validation, `429` rate-limited, and `500` unexpected failure. Do not leak stack traces, SQL errors, account existence, moderation internals, or token values.

Mutating endpoints that may be retried (newsletter subscribe, reactions, contact submission, campaign scheduling, webhooks) should accept or internally implement idempotency keys.

## 10. Security and abuse prevention

- Validate every payload on the server and use parameterized queries/ORM bindings.
- Sanitize rich article HTML using an allowlist before publication; escape all reader text.
- Strict CORS allowlist, secure headers/CSP, HTTPS-only production, HSTS, and secure cookies.
- CSRF protection for cookie-authenticated mutations.
- Per-route and global rate limits; stronger limits for auth, comments, contact, newsletter, and upload operations.
- MIME sniffing, size limits, malware scanning, image re-encoding, and randomized object keys for uploads.
- Authorization checks at service/query level; never rely on hidden admin UI.
- Encrypt sensitive fields where required and use managed encrypted disks/backups.
- Rotate secrets, separate production/staging credentials, and keep secrets out of Git and database settings.
- Structured logs with request IDs and PII redaction; alert on login abuse, role changes, mass exports, webhook failures, and job failures.
- Automated backups plus regularly tested point-in-time recovery.
- Dependency, secret, and static security scanning in CI.

## 11. Caching, SEO, and performance

- Cache public bootstrap/home/category/story responses with short TTLs and surrogate keys; invalidate on publish and curation changes.
- Never publicly cache personalized bookmark/comment state. Either keep it in separate authenticated endpoints or mark responses private.
- Cursor-pagination for stories, comments, users, contacts, subscribers, events, and audit logs.
- Generate/update XML sitemap, news sitemap if applicable, RSS/Atom feeds, canonical metadata, and structured article data on publishing.
- Serve responsive media variants through a CDN and retain explicit width/height.
- Add ETags or `Last-Modified` to public reads.
- Define performance budgets and monitor p95 latency, error rate, cache hit rate, database connections, slow queries, queue delay, and email failure rates.

## 12. Required background jobs

- Publish and unpublish scheduled content.
- Send/expire verification and password-reset emails.
- Process newsletter confirmations, campaigns, delivery events, and retries.
- Generate media variants and clean failed/orphaned uploads.
- Aggregate story metrics and calculate trending scores.
- Update search documents/materialized vectors.
- Send contact acknowledgements and staff notifications.
- Process privacy exports and account deletion/anonymization.
- Remove expired tokens/sessions and enforce retention policies.
- Reconcile denormalized comment/reaction/reply counters.

## 13. Migration from the frontend prototype

1. Create database migrations and seed roles, permissions, categories, public settings, and current static pages.
2. Import the 20 records from `frontend/src/data/stories.js` as published sample stories. Convert each body paragraph array to the selected body block structure, create author records, and retain each existing `id` value as the initial slug so current URLs remain valid.
3. Create homepage sections/items matching the current hard-coded arrangement in `Home.jsx`.
4. Seed demo comments only in non-production environments, or import them clearly marked as sample content with valid system-owned users.
5. Replace `AuthContext` local account storage with auth API calls and secure session handling.
6. Replace `wbn-saved` with bookmark endpoints. Optionally merge guest local bookmarks after login, then remove the local key.
7. Replace `wbn-comments-*` with comment/reply/reaction APIs.
8. Replace `wbn-newsletter` with double-opt-in subscription flow.
9. Change contact copy/button from “save draft” to real submission only after contact API and spam protection are live. A draft may remain locally as a resilience feature, but must not be presented as sent.
10. Update the privacy page before launch to describe actual processors, cookies, retention, analytics, email, user rights, and contact details.
11. Remove demo/local-storage messaging and static date/count claims once backed by real data.

Local demo users contain SHA-256 password hashes and must **not** be migrated. Users must register again or complete a secure account-claim/reset flow.

## 14. Implementation order

### Phase 1 — Content foundation

- Project configuration, PostgreSQL migrations, environment validation, logging, error envelope.
- Categories, authors, media, stories, revisions, static pages.
- Public story/category/search/home APIs.
- Admin login/RBAC and editorial CMS with publishing workflow.
- Import current sample content and replace frontend story imports.

### Phase 2 — Reader accounts

- Registration, verification, login/logout, refresh rotation, forgot/reset password.
- Profile/session controls and bookmarks, including local bookmark merge.
- Authenticated frontend integration and protected saved page.

### Phase 3 — Community

- Comments, replies, reactions, reports, totals, ranking, rate limits.
- Moderation queue, restrictions, audit records, community guidelines page.
- Optional approximate live presence.

### Phase 4 — Newsletter and contact

- Double-opt-in subscribers, preferences, provider webhooks, suppression.
- Contact delivery/inbox, spam controls, assignment and status.
- Campaign/template/segment tools if newsletters will be sent from this system.

### Phase 5 — Analytics and hardening

- Qualified reads, daily aggregation, trending ranking, admin dashboards.
- Cache invalidation, CDN, sitemap/feed automation, load testing, monitoring, restore test, privacy automation.

## 15. Definition of done

### Public and reader experience

- No production feature depends on the static `stories.js` data or browser-only account/community storage.
- All current routes load their content/state from the backend and handle loading, empty, error, unauthorized, and offline states.
- Search covers body, title, description, category, tags, and authors with pagination.
- Saved stories follow a signed-in reader across devices.
- Registration verifies email; password reset uses expiring one-use email tokens.
- Comments, replies, likes, and totals persist correctly and respect moderation/account status.
- Newsletter subscription is double-opt-in and unsubscribe works without login.
- Contact messages reach a protected admin inbox and can be tracked to resolution.
- Published content has stable slugs, correct 404s/redirects, SEO metadata, sitemap entries, and related content.

### Admin operations

- Staff can create, review, preview, schedule, publish, revise, unpublish, archive, and restore content without code changes.
- Staff can arrange every content block currently hard-coded on the homepage.
- Moderators can process comments/reports and restrict abusive accounts.
- Authorized staff can manage subscribers, contacts, users, media, taxonomy, pages, redirects, and site settings.
- Role enforcement is tested at API level and every privileged mutation is auditable.

### Engineering and operations

- Migrations run cleanly on an empty database and rollback/recovery procedures are documented.
- Unit, integration, authorization, and end-to-end tests cover all critical paths.
- Email/webhook/job processing is idempotent and retry-safe.
- Rate limits, CSRF, CORS, input validation, upload protections, secure cookies, and security headers are verified.
- Production has dashboards/alerts, automated backups, a tested restore, retention jobs, and no secrets or personal data in application logs.

## 16. Minimum test matrix

- Auth: register duplicate email, verification expiry/reuse, invalid login, lock/rate limit, refresh rotation/reuse, reset expiry/reuse, logout/all sessions.
- Authorization: every admin endpoint against every role; contributor ownership; privilege-escalation attempts.
- Stories: slug collision, invalid publication, scheduled publish, unpublish, revision restore, redirect, unpublished public 404.
- Search/listing: special characters, empty query, filters, stable pagination, ranking, draft exclusion.
- Bookmarks: repeated add/remove, deleted/unpublished story behavior, guest merge.
- Comments: limits, nesting, sanitization, deleted parent, duplicate reactions, moderation visibility, reports, banned user.
- Newsletter: duplicate subscribe, confirmation, unsubscribe, resubscribe policy, bounce/complaint webhook replay.
- Contact: validation, spam/rate limit, duplicate retry, assignment/resolution, PII access.
- Media: disallowed type, oversized file, malware failure, missing alt text publication rule, referenced-asset deletion.
- Operations: cache invalidation on publish, job retry, provider outage, backup restore, privacy export/deletion.

