import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import postRoutes from "./routes/posts.js";
import authRoutes from "./routes/auth.js";

dotenv.config();  

const app = express();   

// middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// routes
app.use("/api/auth", authRoutes);   
app.use("/api/posts", postRoutes);

// test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

// DB connection
pool.connect()
  .then(() => console.log("PostgreSQL Connected"))
  .catch(err => console.error("DB Connection Error:", err));

// start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});