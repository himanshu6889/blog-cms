import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import postRoutes from "./routes/posts.js";

pool.connect()
  .then(() => console.log("PostgreSQL Connected"))
  .catch(err => console.error("DB Connection Error:", err));

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.use("/api/posts", postRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});