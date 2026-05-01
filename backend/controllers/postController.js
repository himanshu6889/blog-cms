import { pool } from "../db.js";

// CREATE POST
export const createPost = async (req, res) => {
  const {
    title,
    slug,
    category,
    thumbnail,
    description,
    content,
    tags,
    status,
    parent_post,
    access,
    edit_access,
  } = req.body;

  try {
    const userId = req.user.id;
    const result = await pool.query(
      `INSERT INTO posts 
      (title, slug, category, thumbnail, description, content, tags, status, parent_post, access, edit_access, user_id, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW())
      RETURNING *`,
      [title, slug, category, thumbnail, description, content, tags, status || 'draft', parent_post || null, access || 'Anyone', edit_access || 'Logged-in Users', userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE POST ERROR:", err.message);
    console.error("PG CODE:", err.code);
    console.error("PG DETAIL:", err.detail);
    res.status(500).json({ error: err.message });
  }
};

// GET ALL POSTS
export const getPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching posts" });
  }
};

// UPDATE POST
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const {
    title, slug, category, thumbnail, description,
    content, tags, status, parent_post, access, edit_access,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE posts
       SET title=$1, slug=$2, category=$3, thumbnail=$4, description=$5,
           content=$6, tags=$7, status=$8, parent_post=$9, access=$10,
           edit_access=$11, updated_at=NOW()
       WHERE id=$12 AND user_id=$13
       RETURNING *`,
      [title, slug, category, thumbnail, description,
       content, tags, status, parent_post || null, access, edit_access,
       id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE POST
export const deletePost = async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM posts WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting post" });
  }
};


// GET PUBLIC POSTS (no auth required) - includes author info
export const getPublicPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        posts.id,
        posts.title,
        posts.slug,
        posts.category,
        posts.thumbnail,
        posts.description,
        posts.content,
        posts.created_at,
        posts.user_id AS author_id,
        users.name AS author_name,
        users.avatar AS author_avatar
      FROM posts
      LEFT JOIN users ON posts.user_id = users.id
      WHERE posts.status = 'published'
      ORDER BY posts.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("PUBLIC POSTS ERROR:", err);
    res.status(500).json({ error: "Error fetching public posts" });
  }
};

// GET SINGLE POST BY SLUG (public) - includes author info
export const getPostBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        posts.*,
        posts.user_id AS author_id,
        users.name AS author_name,
        users.avatar AS author_avatar
      FROM posts
      LEFT JOIN users ON posts.user_id = users.id
      WHERE posts.slug = $1
      AND posts.status = 'published'
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET POST ERROR:", err);
    res.status(500).json({ error: "Error fetching post" });
  }
};

// GET AUTHOR PROFILE + ALL THEIR PUBLISHED POSTS
// Route: GET /api/authors/:id
export const getAuthorProfile = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch author info
    const authorResult = await pool.query(
      `SELECT id, name, email, avatar FROM users WHERE id = $1`,
      [id]
    );

    if (authorResult.rows.length === 0) {
      return res.status(404).json({ error: "Author not found" });
    }

    // 2. Fetch all published posts by this author
    const postsResult = await pool.query(
      `SELECT 
        id,
        title,
        slug,
        category,
        thumbnail,
        description,
        created_at
      FROM posts
      WHERE user_id = $1
        AND status = 'published'
      ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      author: authorResult.rows[0],
      posts: postsResult.rows,
    });
  } catch (err) {
    console.error("GET AUTHOR PROFILE ERROR:", err);
    res.status(500).json({ error: "Error fetching author profile" });
  }
};
