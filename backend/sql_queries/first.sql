-- post table

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  slug TEXT,
  category TEXT,
  thumbnail TEXT,
  description TEXT,
  content TEXT,
  tags TEXT[],
  parent_post TEXT,
  access TEXT,
  edit_access TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'UTC';

ALTER TABLE posts ADD COLUMN user_id INTEGER;

-- all post view
SELECT * FROM POSTS

-- view post by user
SELECT * FROM posts ORDER BY created_at DESC

-- user table

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN avatar TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- view users
SELECT * FROM users;

-- public post
SELECT id, title, slug FROM posts;


ALTER TABLE posts 
ADD CONSTRAINT fk_posts_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE;