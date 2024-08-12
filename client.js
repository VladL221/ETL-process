const axios = require("axios");
const fs = require("fs").promises;

const SERVER_URL = "http://localhost:8000/liveEvent";

// i didnt impelement strategy patterns on the client since im simulating a client that is like react
class FileEventRepository {
  constructor(filename) {
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

async function sendEvent(event) {
  try {
    await axios.post(SERVER_URL, event, {
      headers: {
        Authorization: "secret",
        "Content-Type": "application/json",
      },
    });
    console.log(`Event sent successfully: ${JSON.stringify(event)}`);
  } catch (error) {
    console.error(`Error sending event: ${error.message}`);
  }
}

async function processEvents() {
  const eventRepository = new FileEventRepository("events.jsonl");
  const events = await eventRepository.getEvents();

  for (const event of events) {
    await sendEvent(event);
  }
}

processEvents().then(() => console.log("All events processed"));
