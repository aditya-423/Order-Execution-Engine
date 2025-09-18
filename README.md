# Order Execution Engine with DEX Routing

This project is a backend system designed to simulate a high-performance order execution engine for decentralized exchanges (DEXs). It features a decoupled architecture using a message queue to handle concurrent orders, mock DEX routing to find the best price, real-time status updates via WebSockets, and persistent storage for order history.

## ✨ Core Features

* **Real-time Order Updates**: Clients receive live status updates (`pending`, `routing`, `confirmed`, etc.) for their orders over a persistent WebSocket connection.
* **DEX Routing Simulation**: The system simulates fetching quotes from mock Raydium and Meteora pools, automatically routing the order to the venue with the best price.
* **Concurrent Processing**: Built with a BullMQ queue system, the engine can process up to 10 orders in parallel, handling high-throughput scenarios.
* **Resilient & Reliable**: Includes exponential backoff retry logic (up to 3 attempts) for failed jobs, ensuring transient errors are handled gracefully.
* **Persistent Order History**: The final status and details of every order are saved to a PostgreSQL database for permanent record-keeping.

## 🏛️ System Architecture & Design Decisions

The core design decision was to create a **decoupled, asynchronous architecture** to ensure the system is scalable, resilient, and responsive. This prevents the API server from getting blocked by slow tasks like blockchain transactions.

The order flow is as follows:

1.  **API Gateway (Fastify Server)**: A client connects via a single WebSocket endpoint. The server's only job is to immediately create an order, add it as a job to the **BullMQ queue**, and then manage the WebSocket connection. This design makes the API layer extremely fast and lightweight.
2.  **Message Queue (Redis & BullMQ)**: The queue acts as a buffer between the API and the core logic. This decouples the systems; the API doesn't need to know about the worker, and vice-versa. It also provides job persistence, so if the worker crashes, orders are not lost.
3.  **Worker Process**: A separate Node.js process is dedicated to processing jobs from the queue. This is where all the heavy lifting happens:
    * Simulating DEX quote fetching.
    * Making routing decisions.
    * Publishing status updates to Redis Pub/Sub.
    * Saving the final result to the database.
    This can be scaled independently of the API server to handle more load.
4.  **Real-time Layer (Redis Pub/Sub & WebSockets)**: For live updates, the worker publishes messages to a unique Redis channel for each order. The Fastify server subscribes to that channel and forwards the messages to the correct client. This is highly efficient and avoids direct coupling between the worker and the server.
5.  **Persistence (PostgreSQL)**: A relational database was chosen for its reliability and structured data, making it ideal for storing a permanent, auditable history of all completed orders.

## 🛠️ Tech Stack

* **Backend**: Node.js, TypeScript
* **Framework**: Fastify
* **Queue**: BullMQ
* **Database**: PostgreSQL
* **In-Memory Store / Broker**: Redis
* **Frontend**: HTML, vanilla JavaScript

## 🚀 Setup Instructions

### Prerequisites

* Node.js (v18 or later)
* npm
* PostgreSQL installed locally or running via Docker.
* Redis installed locally or running via Docker.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    * **PostgreSQL**: Open `src/db.ts` and ensure the `password` and other connection details match your local PostgreSQL setup.
    * **Redis**: Open `src/queue.ts` and ensure the connection details match your Redis setup.

4.  **Set up the Database:**
    * Connect to your PostgreSQL instance using a GUI tool like pgAdmin or DBeaver.
    * Run the following SQL query to create the `orders` table:
        ```sql
        CREATE TABLE orders (
          id VARCHAR(255) PRIMARY KEY,
          status VARCHAR(50) NOT NULL,
          final_price NUMERIC,
          transaction_hash VARCHAR(255),
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ```

5.  **Run the Application:**
    * The project requires both the server and the worker to be running. The recommended way is to use `concurrently`.
    * First, install it if you haven't:
        ```bash
        npm install --save-dev concurrently
        ```
    * Then, add the following scripts to your `package.json`:
        ```json
        "scripts": {
          "start:server": "tsx src/server.ts",
          "start:worker": "tsx src/worker.ts",
          "start": "concurrently \"npm:start:server\" \"npm:start:worker\""
        },
        ```
    * Finally, start both processes with a single command:
        ```bash
        npm start
        ```

### How to Use

1.  Open the `index.html` file in your web browser.
2.  Enter the token symbols and amount you wish to trade.
3.  Click the "Create Order" button.
4.  Watch the new order appear and its status update in real-time.

## 🔮 Future Extensions

This engine is designed to be extensible. Here’s how it could be adapted to support other order types:

* **Limit Orders**: The worker could be modified to periodically check the market price of a token pair against the limit price stored with the job. If the market price crosses the limit price, the execution logic is triggered.
* **Sniper Orders**: This could be implemented by having the worker monitor the blockchain for a new liquidity pool creation event for a specific token. Once the event is detected, the swap is executed instantly.

## 📄 License

This project is licensed under the MIT License.
