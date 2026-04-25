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
    const result = await pool.query(
      `INSERT INTO posts 
      (title, slug, category, thumbnail, description, content, tags)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [title, slug, category, thumbnail, description, content, tags]
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
    const result = await pool.query(
      "SELECT * FROM posts ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching posts" });
  }
};

// ✅ UPDATE POST (was completely missing)
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, category, description, content } = req.body;

  try {
    const result = await pool.query(
      `UPDATE posts
       SET title=$1, category=$2, description=$3, content=$4
       WHERE id=$5
       RETURNING *`,
      [title, category, description, content, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating post" });
  }
};

// DELETE POST
export const deletePost = async (req, res) => {
  try {
    await pool.query("DELETE FROM posts WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting post" });
  }
};
