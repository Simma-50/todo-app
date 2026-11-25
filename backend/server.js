require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost" }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "todo_db",
  waitForConnections: true,
  connectionLimit: 10
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.get("/api/tasks", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, completed, created_at FROM tasks ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not retrieve tasks." });
  }
});

app.post("/api/tasks", async (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  if (!title) return res.status(400).json({ message: "Task title is required." });
  if (title.length > 255) return res.status(400).json({ message: "Title must be 255 characters or fewer." });

  try {
    const [result] = await pool.execute("INSERT INTO tasks (title) VALUES (?)", [title]);
    const [rows] = await pool.execute(
      "SELECT id, title, completed, created_at FROM tasks WHERE id = ?", [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not create task." });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || typeof req.body.completed !== "boolean") {
    return res.status(400).json({ message: "Valid task ID and completed boolean required." });
  }
  try {
    const [result] = await pool.execute(
      "UPDATE tasks SET completed = ? WHERE id = ?", [req.body.completed, id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Task not found." });
    const [rows] = await pool.execute(
      "SELECT id, title, completed, created_at FROM tasks WHERE id = ?", [id]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not update task." });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: "Valid task ID required." });
  try {
    const [result] = await pool.execute("DELETE FROM tasks WHERE id = ?", [id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted." });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not delete task." });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`Todo API listening on port ${PORT}`));
