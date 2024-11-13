const express = require("express");
const cors = require("cors");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const dbpath = path.join(__dirname, "TodoApplication.db");
const app = express();

app.use(cors());
app.use(express.json());

let db = null;

const JWT_SECRET_KEY = "madhava"; // Make sure to keep this secret safe

const initializeAndServe = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(5000, () => {
      console.log("Server started at http://localhost:5000");
    });
    await createTables();
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeAndServe();

const createTables = async () => {
  try {
    await db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      userId INTEGER,
      title TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (userId) REFERENCES users(id)
    )`);
    
    console.log('Tables created successfully');
  } catch (e) {
    console.log('Error creating tables:', e.message);
  }
};

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Invalid JSON:', err.message);
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next();
});

// Sign-up Route
app.post('/signup', async (req, res) => {
  console.log("Received JSON:", req.body);  

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(query, [username, hashedPassword], function (err) {
      if (err) {
        return res.status(500).json({ error: 'User registration failed' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const userQuery = `SELECT * FROM users WHERE username = ?`;
    const user = await db.get(userQuery, [username]);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Issue a JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); 

  if (!token) {
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }

  jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = decoded; // Attach the decoded JWT (including userId) to the request object
    next(); 
  });
};

// Create Task Route
app.post("/tasks", authenticateJWT, async (req, res) => {
  const { title, description, status = 'pending' } = req.body;
  const userId = req.user.id; // Access userId from the decoded JWT

  const taskId = uuidv4(); 

  try {
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tasks (id, userId, title, description, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [taskId, userId, title, description, status],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID); 
        }
      );
    });

    res.status(201).json({ message: "Task created successfully", taskId });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Tasks Route
app.get('/tasks', authenticateJWT, (req, res) => {
  const userId = req.user.id; // Access userId from the decoded JWT
  console.log('Authenticated User ID:', userId);  

  db.all(`SELECT * FROM tasks WHERE userId = ?`, [userId], (err, tasks) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch tasks' });
    res.json({ tasks });
  });
});

// Update Task Route
app.put('/tasks/:id', authenticateJWT, (req, res) => {
  const { title, description, status } = req.body;
  const taskId = req.params.id;

  db.run(
    `UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ? AND userId = ?`,
    [title, description, status, taskId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Task update failed' });
      res.json({ message: 'Task updated successfully' });
    }
  );
});

// Delete Task Route
app.delete('/tasks/:id', authenticateJWT, (req, res) => {
  const taskId = req.params.id;

  db.run(
    `DELETE FROM tasks WHERE id = ? AND userId = ?`,
    [taskId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Task deletion failed' });
      res.json({ message: 'Task deleted successfully' });
    }
  );
});
