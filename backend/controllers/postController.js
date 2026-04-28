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
  } = req.body;

  try {
    const userId = req.user.id; // Get user ID from auth middleware
    const result = await pool.query(
      `INSERT INTO posts 
      (title, slug, category, thumbnail, description, content, tags, user_id, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
      RETURNING *`,
      [title, slug, category, thumbnail, description, content, tags, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating post" });
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
  const { title, category, description, content } = req.body;

  try {
    const result = await pool.query(
      `UPDATE posts
       SET title=$1, category=$2, description=$3, content=$4
       WHERE id=$5 AND user_id=$6
       RETURNING *`,
      [title, category, description, content, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: "Error updating post" });
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
        users.name AS author_name,
        users.avatar AS author_avatar
      FROM posts
      LEFT JOIN users ON posts.user_id = users.id
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
        users.name AS author_name,
        users.avatar AS author_avatar
      FROM posts
      LEFT JOIN users ON posts.user_id = users.id
      WHERE posts.slug = $1
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
