# Legal Matter Tracker

A full-stack application for managing legal matters, built with NestJS (Backend), React (Frontend), and PostgreSQL, fully orchestrated using Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Git](https://git-scm.com/)

## Getting Started

Follow these steps to clone the repository and start the development environment.

### 1. Clone the repository

```bash
git clone <repository-url>
cd legal-matter-tracker
```

### 2. Configure Environment Variables

Create `.env` files based on the provided examples. You'll need to define environment variables for both the backend and frontend.

```bash
# In the root, backend, frontend as needed
# cp .env.example .env
```

### 3. Start the Development Environment

Run the application using Docker Compose. This will build and start the PostgreSQL database, NestJS backend, and React frontend.

```bash
docker compose up
```

### 4. Database Setup & Seeding

Database initial migration and seeding is done automatically at Docker startup via `prisma.config.ts`. 

### 5. Access the Application

- **Frontend (React)**: [http://localhost:5173](http://localhost:5173)
- **Backend (NestJS API)**: [http://localhost:3000](http://localhost:3000)

## Architectural Tradeoffs & Decisions

- **Single Docker Compose Orchestration:** We use a unified Docker Compose setup for ease of local development bridging frontend, backend, and the DB without requiring external dependencies or complex native setups.
- **Strict TypeScript & Validation (NestJS):** Heavy reliance on strictly typed interfaces, NestJS pipes, and `class-validator` enforces predictable 422 responses for bad inputs instead of failing silently.
- **LLM Synchronous Integration:** The matter summary generation currently relies on a synchronous API call to an LLM provider. This keeps the architecture simple but might require queuing (e.g., BullMQ) in the future if summaries take longer than standard HTTP timeouts.
- **Authentication:** Standard JWT-based local authentication implementation. Simple, easily stored and cleared from the React frontend, yet fully protects the NestJS routes using custom guards.

- **Testing:** In this project testing is done locally outside of Docker environment and you need to run `npm ci` in frontend and backend directories. Prisma Client is automatically generated for the backend in via `package.json` script. In the future it might be cleaner to run the tests directly inside the Docker environment.
