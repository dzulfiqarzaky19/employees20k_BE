# Employees 20K Backend

This is the backend service for the Employees 20K application. It provides an API for managing employee records, authentication, and more.

## Prerequisites

-   [Docker](https://docs.docker.com/get-docker/) installed.
-   [Docker Compose](https://docs.docker.com/compose/install/) installed.
-   [Node.js](https://nodejs.org/) (v18 or higher) - *Optional, for local development without Docker*.

## Getting Started (Docker - Recommended)

The easiest way to start the application is using Docker. This will set up the API, PostgreSQL database, and Redis.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/dzulfiqarzaky19/employees20k_BE.git
    cd employees20k_BE
    ```

2.  **Start the services**:
    ```bash
    docker compose up --build
    ```
    This command will:
    -   Build the API image.
    -   Start PostgreSQL and Redis containers.
    -   Run database migrations.
    -   Seed the database with initial data.
    -   Start the API server.

3.  **Access the API**:
    The server will be running at `http://localhost:3000`.

## Local Development (Without Docker)

If you prefer to run the Node.js application locally:

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Configuration**:
    Create a `.env` file in the root directory with the following variables:
    ```env
    PORT=3000
    DATABASE_URL="postgresql://admin:password@localhost:5432/ems_db?schema=public"
    REDIS_URL="redis://localhost:6379"
    JWT_SECRET="super-secret-key"
    NODE_ENV="development"
    ```

3.  **Start dependencies (Database & Redis)**:
    You can use Docker to just start the database and Redis:
    ```bash
    docker compose up db redis -d
    ```

4.  **Run Migrations**:
    ```bash
    npx prisma migrate dev
    ```

5.  **Seed Database**:
    ```bash
    npm run seed
    ```

6.  **Start Development Server**:
    ```bash
    npm run dev
    ```

## Scripts

-   `npm run build`: Compile the TypeScript code.
-   `npm run dev`: Start the development server with hot-reloading.
-   `npm test`: Run unit tests.
-   `npm run seed`: Seed the database.
-   `npm run reset`: Reset the database (clean slate).
-   `npm run generate-csv`: Generate a CSV file with random employee data.

## Collections
- HTTPIE collections inside `collections/httpie-collection-ems_BE.json`

## Project Structure

```
project-root/
│
├── src/
│   ├── index.ts                # Entry point (bootstraps app)
│   ├── app.ts                  # Express app setup (middleware, routes)
│   │
│   ├── config/                 # Configuration files
│   │   ├── database.ts
│   │   ├── env.ts
│   │   ├── queue.ts
│   │   └── socket.ts
│   │
│   ├── routes/                 # Routers (group endpoints)
│   │   ├── auth.router.ts
│   │   ├── employee.router.ts
│   │   └── import.router.ts
│   │
│   ├── controllers/            # Controllers (handle req/res)
│   │   ├── auth.controller.ts
│   │   ├── employee.controller.ts
│   │   └── import.controller.ts
│   │
│   ├── services/               # Business logic
│   │   ├── auth.service.ts
│   │   ├── employee.service.ts
│   │   └── import.service.ts
│   │
│   ├── repositories/           # Data access layer
│   │   ├── auth.repository.ts
│   │   ├── employee.repository.ts
│   │
│   ├── dtos/                   # Data Transfer Objects
│   │   └── login.dto.ts
│   │
│   ├── models/                 # ORM models/entities
│   │   └── prisma/             # Prisma schema + generated client
│   │       └── schema.prisma
│   │
│   ├── middleware/             # Middleware (auth, logging, validation)
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── multer.middleware.ts
│   │
│   ├── utils/                  # Helpers/utilities
│   │   ├── hash.util.ts
│   │   └── jwt.util.ts
│   │
│   ├── errors/                 # Custom error classes
│   │   └── AppError.ts
│   │
│   └── workers/                # Background workers
│       ├── employee.worker.ts
│       └── import.worker.ts
│
├── tests/                      # Unit/integration tests
├── .env                        # Environment variables
├── package.json
└── tsconfig.json
```
