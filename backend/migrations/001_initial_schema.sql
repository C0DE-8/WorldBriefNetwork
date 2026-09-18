CREATE TABLE IF NOT EXISTS schema_migrations (
  filename VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE roles (
  id CHAR(36) PRIMARY KEY,
  role_key VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  status ENUM('active','suspended','banned','pending_deletion','anonymized') NOT NULL DEFAULT 'active',
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  granted_by CHAR(36) NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT user_roles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_role_fk FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_granter_fk FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE auth_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  user_agent VARCHAR(500) NULL,
  ip_hash CHAR(64) NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY auth_sessions_user_idx (user_id, revoked_at),
  CONSTRAINT auth_sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE account_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_type ENUM('verify_email','reset_password') NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY account_tokens_user_idx (user_id, token_type, consumed_at),
  CONSTRAINT account_tokens_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  nav_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE authors (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  bio TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE stories (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(220) NOT NULL UNIQUE,
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  body_json JSON NOT NULL,
  image_url TEXT NOT NULL,
  image_caption VARCHAR(500) NULL,
  image_credit VARCHAR(200) NULL,
  category_id CHAR(36) NOT NULL,
  author_id CHAR(36) NOT NULL,
  location VARCHAR(120) NULL,
  reading_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  status ENUM('draft','in_review','approved','scheduled','published','unpublished','archived') NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  comments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  seo_title VARCHAR(70) NULL,
  seo_description VARCHAR(170) NULL,
  published_at DATETIME NULL,
  scheduled_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  KEY stories_status_date_idx (status, published_at),
  KEY stories_category_date_idx (category_id, status, published_at),
  FULLTEXT KEY stories_search_fulltext (title, description),
  CONSTRAINT stories_category_fk FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT stories_author_fk FOREIGN KEY (author_id) REFERENCES authors(id),
  CONSTRAINT stories_creator_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT stories_updater_fk FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE story_revisions (
  id CHAR(36) PRIMARY KEY,
  story_id CHAR(36) NOT NULL,
  revision_number INT NOT NULL,
  snapshot JSON NOT NULL,
  change_summary VARCHAR(500) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY story_revision_unique (story_id, revision_number),
  CONSTRAINT revisions_story_fk FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT revisions_user_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE bookmarks (
  user_id CHAR(36) NOT NULL,
  story_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, story_id),
  KEY bookmarks_user_date_idx (user_id, created_at),
  CONSTRAINT bookmarks_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT bookmarks_story_fk FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE comments (
  id CHAR(36) PRIMARY KEY,
  story_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  author_name_snapshot VARCHAR(100) NOT NULL,
  parent_id CHAR(36) NULL,
  body VARCHAR(1000) NOT NULL,
  status ENUM('pending','approved','hidden','spam','deleted') NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  KEY comments_story_idx (story_id, status, created_at),
  KEY comments_parent_idx (parent_id, status, created_at),
  CONSTRAINT comments_story_fk FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT comments_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT comments_parent_fk FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE comment_reactions (
  comment_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  reaction_type VARCHAR(20) NOT NULL DEFAULT 'like',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, user_id, reaction_type),
  CONSTRAINT reactions_comment_fk FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  CONSTRAINT reactions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE comment_reports (
  id CHAR(36) PRIMARY KEY,
  comment_id CHAR(36) NOT NULL,
  reporter_user_id CHAR(36) NOT NULL,
  reason VARCHAR(40) NOT NULL,
  details TEXT NULL,
  status ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
  resolved_by CHAR(36) NULL,
  resolved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY report_once_unique (comment_id, reporter_user_id),
  CONSTRAINT reports_comment_fk FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  CONSTRAINT reports_reporter_fk FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reports_resolver_fk FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE newsletter_subscribers (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  status ENUM('pending','active','unsubscribed','bounced','complained','suppressed') NOT NULL DEFAULT 'pending',
  source VARCHAR(100) NOT NULL DEFAULT 'website',
  consent_at DATETIME NOT NULL,
  confirmed_at DATETIME NULL,
  unsubscribed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT subscribers_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE contact_messages (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  subject ENUM('story_idea','general','partnerships','corrections') NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','in_progress','resolved','spam') NOT NULL DEFAULT 'new',
  assigned_to CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY contacts_status_date_idx (status, created_at),
  CONSTRAINT contacts_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT contacts_assignee_fk FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE static_pages (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  body_json JSON NOT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE home_sections (
  id CHAR(36) PRIMARY KEY,
  section_key VARCHAR(80) NOT NULL UNIQUE,
  section_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NULL,
  subtitle TEXT NULL,
  settings JSON NULL,
  position INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE home_section_items (
  id CHAR(36) PRIMARY KEY,
  section_id CHAR(36) NOT NULL,
  story_id CHAR(36) NULL,
  label VARCHAR(120) NULL,
  target_url TEXT NULL,
  position INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY section_position_unique (section_id, position),
  CONSTRAINT section_items_section_fk FOREIGN KEY (section_id) REFERENCES home_sections(id) ON DELETE CASCADE,
  CONSTRAINT section_items_story_fk FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(100) NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY audit_entity_idx (entity_type, entity_id),
  CONSTRAINT audit_actor_fk FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
