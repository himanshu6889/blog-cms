-- USERS TABLE FIRST (important for FK)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  avatar TEXT,
  bio TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT * FROM posts ORDER BY created_at DESC;


SELECT * FROM users;

-- POSTS TABLE
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
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';


ALTER TABLE posts ADD COLUMN IF NOT EXISTS parent_post TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS access TEXT DEFAULT 'Anyone';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS edit_access TEXT DEFAULT 'Logged-in Users';

ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

SELECT * FROM POSTS;

SELECT id, title, slug FROM posts;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts'
ORDER BY ordinal_position;


-- ONE-TIME CLEANUP: removes duplicate slugs, keeps the oldest row per slug. Do NOT run routinely.
DELETE FROM posts
WHERE id NOT IN (
  SELECT MIN(id) FROM posts GROUP BY slug
);