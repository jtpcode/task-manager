# Legal Matter Tracker

A full-stack application for managing legal matters, built with NestJS (Backend), React (Frontend), and PostgreSQL, fully orchestrated using Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

## Getting Started

Follow these steps to clone the repository and start the production/development environment.

### 1. Clone the repository

```bash
git clone <repository-url>
cd legal-matter-tracker
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

Database initial migration and seeding is done automatically at Docker startup via `prisma.config.ts` and `seed.ts`. 

### 5. Access the Application

- **Frontend (React)**: [http://localhost:5173](http://localhost:5173)
- **Backend (NestJS API)**: [http://localhost:3000](http://localhost:3000)

### 6. Running backend E2E Tests

Only backend e2e tests were implemented for this project and the tests are run locally, outside the Docker environment. To run the tests, make sure you have the test database configured and running (via `docker-compose.dev.yml`). First install the dependencies in both frontend and backend:

```bash
cd frontend
npm ci
cd ../backend
npm ci
```

Prisma client is automatically generated for the backend via `package.json` script. Then run the backend e2e tests:

```bash
cd backend
npm test:e2e
```

## Architectural Decisions & Trade-offs

- **TypeScript version:** 5.x version was chosen for frontend and backend, because NestJS installation already came with that version. Also, the 6.x version was released only a few weeks ago and it is not yet widely adopted, which at this point may cause compatibility issues.

- **Prisma Migrate:** Prisma was chosen because it was new to the developer and also the job announcement implied it might be good to know.

- **Google Gemini API:** The decision to use Google Gemini API was based on ease of integration and from the developers point of view it has proven to be a good all-around AI.

- **Testing:** The decision to run tests locally outside of Docker was made to simplify the testing process and avoid the overhead of running tests inside a container. In the future, it might be cleaner to run the tests directly inside the Docker environment. Also frontend testing was left out of the scope of this project and because of time constraints, but in a real-world application, it would be important to implement especially for the parts that require calculations in the frontend, like transforming minutes into hours.

## Future Improvements

- **State Management**: Implement for example TanStack Query for frontend state management.
- **Matter Management**: Add features for deleting, editing, and modifying individual legal matters like changing their status.
- **Time Entry Management**:Add features for deleting, editing, and modifying individual time entries.
- **User Profile**: Allow users to view and edit their own profile information.
- **AI Enhancements**: Improve AI prompt engineering and save the generated summaries to the database.
- **Logging and Monitoring**: Implement logging and monitoring for the application.
- **The list goes on..**


