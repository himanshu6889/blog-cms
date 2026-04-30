import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

// ✅ Single shared cookie config — must be identical when setting AND clearing
// Without maxAge, the browser treats it as a session cookie and drops it
// on cross-site navigation (Vercel → Railway)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );
    const newUser = result.rows[0];
    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (err) {
    console.log("Signup Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...safeUser } = user;

    res.cookie("token", token, COOKIE_OPTIONS).json({ user: safeUser });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Login failed" });
  }
};

// LOGOUT
export const logout = (req, res) => {
  // ✅ clearCookie must use the same options as when the cookie was set
  res.clearCookie("token", COOKIE_OPTIONS).json({ message: "Logged out" });
};

// GET CURRENT USER
export const getMe = (req, res) => {
  res.json({ user: req.user });
};
