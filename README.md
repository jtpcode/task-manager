# Task Manager

A full-stack application for managing tasks and logging work entries, built with NestJS (Backend), React (Frontend), and PostgreSQL, fully orchestrated using Docker Compose. Key features include secure **cookie-based authentication** using HttpOnly JWT cookies and an **AI-powered summary feature** that helps turn task entry logs into readable, actionable summaries.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

## Getting Started

Follow these steps to clone the repository and start the production/development environment.

### 1. Clone the repository

```bash
git clone <repository-url>
cd task-manager
```

### 2. Configure Environment Variables

Create `.env` file at the root of the project based on the provided `.env.example`. For a quick start the only thing you need to change is the `GOOGLE_AI_API_KEY` to match the one you can obtain from [Google AI Studio](https://aistudio.google.com/).

```bash
cp .env.example .env
```

### 3.1 Starting the Production Environment

Run the application using Docker Compose. This will build and start the PostgreSQL database, NestJS backend, and React frontend.

```bash
docker compose up
```
### 3.2 Starting the Development Environment

For development, you can start the services in Docker *development* environment. This also starts a test database for running tests locally.

```bash
docker compose -f docker-compose.dev.yml up
```

In development mode, the backend and frontend will watch for file changes and automatically reload. Only after installing a new package you need to rebuild the Docker images:

```bash
docker compose -f docker-compose.dev.yml up --build
```


### 4. Database Setup & Seeding

Database initial migration and seeding is done automatically at Docker startup. 

### 5. Access the Application

- **Frontend (React)**: [http://localhost:5173](http://localhost:5173)

### 6. Running backend E2E Tests

Only backend e2e tests were implemented for this project and the tests are run locally, outside the Docker environment. First install the dependencies in both frontend and backend:

```bash
cd frontend
npm ci
cd ../backend
npm ci
```

Prisma client is automatically generated for the backend via `package.json` script. To run the tests, make sure you are on ***development*** environment (via `docker-compose.dev.yml`):

```bash
cd backend
npm run test:e2e
```

## Future Improvements

- **State Management**: Implement for example TanStack Query for frontend state management.
- **Task Management**: Add features for deleting, editing, and modifying individual tasks like changing their status.
- **Task Entry Management**: Add features for deleting, editing, and modifying individual task entries.
- **User Profile**: Allow users to view and edit their own profile information.
- **AI Enhancements**: Improve AI prompt engineering and save the generated summaries to the database.
- **Logging and Monitoring**: Implement logging and monitoring for the application.


