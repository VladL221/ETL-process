const express = require("express");
const fs = require("fs").promises;
const { Pool } = require("pg");
// in a perfect world i would had used typescript and made this an interface
class EventRepository {
  async getEvents() {
    throw new Error("getEvents method must be implemented");
  }
}

class DatabaseConnection {
  constructor(config) {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    this.pool = new Pool(config);
    DatabaseConnection.instance = this;
  }

  async query(sql, params) {
    return this.pool.query(sql, params);
  }

  async close() {
    return this.pool.end();
  }
}

class FileEventRepository extends EventRepository {
  constructor(filename) {
    super();
    this.filename = filename;
  }

  async getEvents() {
    const data = await fs.readFile(this.filename, "utf8");
    return data
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        try {
          return JSON.parse(line.trim());
        } catch (error) {
          console.error(`Error parsing line: ${line}`);
          console.error(error);
          return null;
        }
      })
      .filter((event) => event !== null);
  }
}

class Server {
  constructor(eventRepository, dbConnection) {
    this.eventRepository = eventRepository;
    this.dbConnection = dbConnection;
    this.app = express();
    this.port = 8000;

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
  }

  setupRoutes() {
    this.app.post(
      "/liveEvent",
      this.authenticate,
      this.handleLiveEvent.bind(this)
    );
    this.app.get("/userEvents/:userId", this.handleUserEvents.bind(this));
  }

  authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader !== "secret") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  }

  async handleLiveEvent(req, res) {
    try {
      const event = req.body;
      await this.processEvent(event);
      res.status(200).json({ message: "Event processed successfully" });
    } catch (err) {
      console.error("Error processing event:", err);
      res.status(500).json({ error: "Error processing event" });
    }
  }

  async processEvent(event) {
    const { userId, name, value } = event;
    const revenueChange = name === "add_revenue" ? value : -value;

    const updateQuery = `
      INSERT INTO users_revenue (user_id, revenue)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET revenue = users_revenue.revenue + $2
    `;

    await this.dbConnection.query(updateQuery, [userId, revenueChange]);
    console.log(`Updated revenue for user ${userId}: ${revenueChange}`);
  }

  async handleUserEvents(req, res) {
    const { userId } = req.params;
    try {
      const result = await this.dbConnection.query(
        "SELECT revenue FROM users_revenue WHERE user_id = $1",
        [userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ userId, revenue: result.rows[0].revenue });
    } catch (err) {
      console.error("Error querying database:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Server running at http://localhost:${this.port}`);
    });
  }
}
// in a perfect world this would be taken from ENV_VARIABLES
const dbConfig = {
  user: "user_name",
  host: "localhost",
  database: "database_name",
  password: "",
  port: 5432,
};

const dbConnection = new DatabaseConnection(dbConfig);
const eventRepository = new FileEventRepository("events.jsonl");

const server = new Server(eventRepository, dbConnection);
server.start();
