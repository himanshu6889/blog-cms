import { pool } from "../db.js";

// GET CURRENT USER PROFILE
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT id, name, email, avatar, bio FROM users WHERE id = $1",
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, avatar, bio } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET name=$1, avatar=$2, bio=$3
       WHERE id=$4
       RETURNING id, name, email, avatar, bio`,
      [name, avatar, bio, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating profile" });
  }
};