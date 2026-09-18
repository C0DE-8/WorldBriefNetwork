CREATE TABLE author_followers (
  author_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (author_id, user_id),
  KEY author_followers_user_idx (user_id, created_at),
  CONSTRAINT author_followers_author_fk FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
  CONSTRAINT author_followers_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
