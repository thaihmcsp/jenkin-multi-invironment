// app.js
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
require("dotenv").config();
console.log(process.env.DB_HOST);

const app = express();
const port = 3000;

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: "128.199.94.196",
  port: 3306,
  user: "training",
  password: "training_pw",
  database: "users",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create users table if not exists
pool.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
  )
`);

// Parse JSON bodies
app.use(express.json());

// Middleware to check if the user exists
const checkUserExists = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    if (!rows.length) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.user = rows[0];
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Health check endpoint
/**
 * @swagger
 * /api/v1/ping:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Pong response
 */
app.get("/api/v1/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

// Get user by ID
/**
 * @swagger
 * /api/v1/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 */
app.get("/api/v1/user/:id", checkUserExists, (req, res) => {
  const { id, username, email } = req.user;
  res.json({ id, username, email });
});

// Get all users
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 */
app.get("/api/v1/users", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT id, username, email FROM users");
    res.json({ users: rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Edit user
/**
 * @swagger
 * /api/v1/user:
 *   post:
 *     summary: Edit user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: User edited successfully
 */
app.post("/api/v1/user", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res
      .status(400)
      .json({ error: "Username, email, and password are required" });
    return;
  }

  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.execute(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    res.json({ message: "User created successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login
/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 */
app.post("/api/v1/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (!rows.length) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Serve Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Your API Documentation",
      version: "1.0.0",
      description: "API documentation for your Node.js API with MySQL",
    },
  },
  apis: ["app.js"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
