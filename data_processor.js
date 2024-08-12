const fs = require("fs").promises;
const { Pool } = require("pg");
// in a perfect world this would be an interface
class EventProcessingStrategy {
  async process(event, dbConnection) {
    throw new Error("process method must be implemented");
  }
}

class RevenueProcessingStrategy extends EventProcessingStrategy {
  async process(event, dbConnection) {
    const { userId, name, value } = event;
    const revenueChange = name === "add_revenue" ? value : -value;

    const updateQuery = `
      INSERT INTO users_revenue (user_id, revenue)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET revenue = users_revenue.revenue + $2
    `;

    try {
      await dbConnection.query(updateQuery, [userId, revenueChange]);
      console.log(`Updated revenue for user ${userId}: ${revenueChange}`);
    } catch (error) {
      console.error("Error updating revenue:", error);
    }
  }
}
// in a perfect world this would be an interface
class DataStorageStrategy {
  async getEvents() {
    throw new Error("getEvents method must be implemented");
  }
}

class FileStorageStrategy extends DataStorageStrategy {
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

class DataProcessor {
  constructor(storageStrategy, processingStrategies, dbConnection) {
    this.storageStrategy = storageStrategy;
    this.processingStrategies = processingStrategies;
    this.dbConnection = dbConnection;
  }

  async processEvents() {
    const events = await this.storageStrategy.getEvents();
    for (const event of events) {
      const strategy = this.processingStrategies[event.name];
      if (strategy) {
        await strategy.process(event, this.dbConnection);
      } else {
        console.warn(
          `No processing strategy found for event type: ${event.name}`
        );
      }
    }
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
const storageStrategy = new FileStorageStrategy("events.jsonl");
const processingStrategies = {
  add_revenue: new RevenueProcessingStrategy(),
  subtract_revenue: new RevenueProcessingStrategy(),
};

const dataProcessor = new DataProcessor(
  storageStrategy,
  processingStrategies,
  dbConnection
);

dataProcessor.processEvents().then(() => {
  console.log("All events processed");
  dbConnection.close();
});
