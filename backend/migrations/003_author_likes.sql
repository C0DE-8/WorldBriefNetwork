CREATE TABLE author_likes (
  author_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (author_id, user_id),
  CONSTRAINT author_likes_author_fk FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
  CONSTRAINT author_likes_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
