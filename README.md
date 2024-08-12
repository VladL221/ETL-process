# ETL System

The project implements a simple ETL (Extract, Transform, Load) system. The project adheres to SOLID principles, uses dependency injection, and implements the Singleton and Strategy patterns.

## Prerequisites

- Node.js (v14 or later)
- PostgreSQL
- Postman (for API testing)

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Set up the database:

   - Create a new PostgreSQL database
   - Update the database connection details in `server.js` and `data_processor.js`
   - Run the SQL script to create the necessary table:
     ```
     psql -U postgres -d postgres -f db.sql
     ```

3. Create an `events.jsonl` file in the project root with sample events:
   ```jsonl
   { "userId": "user1", "name": "add_revenue", "value": 98 }
   { "userId": "user1", "name": "subtract_revenue", "value": 72 }
   { "userId": "user2", "name": "add_revenue", "value": 70 }
   ```

## Running the System

1. Start the server:

   ```
   node server.js
   ```

2. In a new terminal, run the client to send events to the server:

   ```
   node client.js
   ```

3. After the client has finished, run the data processor to update the database:
   ```
   node data_processor.js
   ```

## API Endpoints

- POST `/liveEvent`: Receives events from the client
- GET `/userEvents/:userId`: Retrieves revenue data for a specific user

## Testing with Postman

### Testing POST /liveEvent

1. Open Postman and create a new request
2. Set the HTTP method to POST
3. Enter the URL: `http://localhost:8000/liveEvent`
4. In the Headers tab, add:
   - Key: `Content-Type`, Value: `application/json`
   - Key: `Authorization`, Value: `secret`
5. In the Body tab, select 'raw' and JSON, then enter:
   ```json
   {
     "userId": "user3",
     "name": "add_revenue",
     "value": 100
   }
   ```
6. Click 'Send'
7. Expected response: Status 200 OK with a message "Event processed successfully"

### Testing GET /userEvents/:userId

1. Create a new request in Postman
2. Set the HTTP method to GET
3. Enter the URL: `http://localhost:8000/userEvents/user3`
4. In the Headers tab, add:
   - Key: `Authorization`, Value: `secret`
5. Click 'Send'
6. Expected response: Status 200 OK with the user's revenue data, or 404 if the user is not found

## Design Principles and Patterns

### SOLID Principles

This project adheres to SOLID principles in several ways:

1. Single Responsibility Principle (SRP):

   - Each class has a single, well-defined responsibility. For example, `FileEventRepository` is responsible only for file-based event storage and retrieval.
   - The `Server` class handles HTTP requests and responses, while `DataProcessor` focuses on processing events.

2. Open/Closed Principle (OCP):

   - The system is open for extension but closed for modification. New event types or storage methods can be added without changing existing code, particularly due to the use of the Strategy pattern.

3. Liskov Substitution Principle (LSP):

   - Subclasses like `FileEventRepository` can be used interchangeably with their base class `EventRepository` without affecting the correctness of the program.

4. Interface Segregation Principle (ISP):

   - Interfaces (abstract base classes in this case) are kept focused and minimal. For example, `EventProcessingStrategy` has only one method, `process`.

5. Dependency Inversion Principle (DIP):
   - High-level modules depend on abstractions, not concretions. For instance, `DataProcessor` depends on `DataStorageStrategy` and `EventProcessingStrategy` interfaces, not on concrete implementations.

### Dependency Injection

Dependency Injection is used throughout the project to improve modularity and testability:

1. In the `Server` class:

   ```javascript
   constructor(eventRepository, dbConnection) {
     this.eventRepository = eventRepository;
     this.dbConnection = dbConnection;
     // ...
   }
   ```

   The `eventRepository` and `dbConnection` are injected, allowing for different implementations to be used without changing the `Server` class.

2. In the `DataProcessor` class:

   ```javascript
   constructor(storageStrategy, processingStrategies, dbConnection) {
     this.storageStrategy = storageStrategy;
     this.processingStrategies = processingStrategies;
     this.dbConnection = dbConnection;
   }
   ```

   All dependencies are injected, making the `DataProcessor` flexible and easy to test with different strategies.

3. When creating instances:
   ```javascript
   const dbConnection = new DatabaseConnection(dbConfig);
   const eventRepository = new FileEventRepository("events.jsonl");
   const server = new Server(eventRepository, dbConnection);
   ```
   Dependencies are created separately and then injected, allowing for easy substitution and testing.

### Singleton Pattern

The system uses the Singleton pattern for database connections to ensure only one connection pool is created.

### Strategy Pattern

The data processor uses the Strategy pattern for both event processing and data storage. This allows for:

1. Easy addition of new event types: Simply create a new processing strategy and add it to the `processingStrategies` object.
2. Flexible data storage: The system can easily switch between different storage methods (e.g., file-based, database) by implementing new storage strategies.

Benefits of the Strategy Pattern in this system:

- Improved extensibility: New event types or storage methods can be added without modifying existing code.
- Better separation of concerns: Each strategy encapsulates its own logic.
- Runtime flexibility: Strategies can be switched dynamically if needed.

## Notes

- The server authenticates clients using the 'Authorization' header with the value 'secret'
- The `events.jsonl` file is used as input and should not be modified by the application
- The code follows SOLID principles and uses dependency injection for better modularity and testability

## Potential Improvements

1. Enhanced Error Handling:

   - Create a custom error handling middleware for Express
   - Implement a centralized error logging system
   - Use more specific error types for different scenarios

2. Implement More Design Patterns:

   - Observer Pattern: For event-driven architecture
   - Factory Pattern: For creating different types of events or processors
   - Command Pattern: For encapsulating database operations

3. Improved Configuration Management:

   - Use environment variables for configuration
   - Implement different config files for development, testing, and production environments

4. Robust Logging System:

   - Implement a structured logging system (e.g., using Winston)
   - Add request ID to track requests across the system

5. Migrate to TypeScript:

   - Catch type-related errors at compile-time rather than runtime
   - Improve code quality and reduce bugs
   - Self-documenting code with interfaces and type definitions
   - Better support for concepts like interfaces, generics, and enums

6. Testing:

   - Implement unit tests for each component
   - Add integration tests for the entire system flow
   - Use a test database for integration tests

7. Security Enhancements:

   - Implement proper authentication (e.g., JWT, Cookie)
   - Use HTTPS for all communications
   - Implement rate limiting to prevent abuse

8. Scalability Improvements:

   - Implement a queue system for processing events asynchronously
   - Use a caching layer (e.g., Redis) for frequently accessed data

9. Code Organization:

   - Separate routes, controllers, and services into different files
   - Create a proper folder structure for better organization

10. Database Improvements:

    - Implement database migrations for version control of schema changes
    - Use an ORM like Sequelize for better database interaction

11. API Documentation:

    - Implement Swagger for API documentation

12. Private NPM Package:

    - Create a private npm package for shared code (e.g., common utilities, database connection logic)
    - This promotes code reuse across different parts of the system or related projects
    - Versioning of the shared code becomes easier to manage

13. Microservices Architecture:

    - Separate each component (client, server, data processor) into its own microservice
    - Benefits include:
      - Improved separation of concerns
      - Independent scalability of each component
      - Easier maintenance and updates
      - Potential for using different technologies for each service if needed
    - Considerations for implementing microservices:
      - Implement service discovery (e.g., using Consul or Etcd)
      - Use a message broker (e.g., RabbitMQ, Apache Kafka) for communication between services
      - Implement API gateways for routing and load balancing
      - Use containerization (e.g., Docker) for consistent deployment across environments

14. Performance Optimization:

    - Implement database indexing strategies
    - For a larger scale we could had opted into a mongodb with horizontal data sharding scale

15. Internationalization and Localization:

    - Prepare the system for multi-language support

16. Expand Strategy Pattern Usage:
    - Implement more processing strategies for different event types
    - Create additional storage strategies (e.g., database storage, cloud storage)
    - Allow dynamic strategy selection based on configuration or event properties

These improvements would significantly enhance the system's robustness, maintainability, scalability.
