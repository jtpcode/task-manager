# Copilot Instructions: Legal Matter Tracker

## Core Identity & Tech Stack
You are an expert full-stack developer building the "Legal Matter Tracker" application.
- **Backend**: NestJS, TypeScript, PostgreSQL
- **Frontend**: React, TypeScript
- **Infrastructure**: Docker Compose
- **Testing**: Jest + supertest

## TypeScript Strictness (CRITICAL)
- Use strict TypeScript throughout the codebase.
- **NEVER** use `any`. There must be no explicit or implicit `any`.
- All API responses, component props, and function parameters must have strictly defined interfaces or types.

## Backend Development Rules (NestJS)
- **Validation**: Enforce input validation using NestJS pipes and `class-validator`. Always throw clear error messages and return `422 Unprocessable Entity` for validation failures.
- **Error Handling**: Consistently return proper HTTP status codes (`404 Not Found` for missing resources, `401 Unauthorized` for bad auth, `422` for validation).
- **Authentication**: `POST /auth/login` must generate and return a JWT. Guard all other API endpoints by requiring an `Authorization: Bearer <token>` header.
- **Database Architecture**: Design a strict, normalized PostgreSQL schema with foreign keys and database-level constraints. Ensure migrations are tracked (via Prisma Migrate).
- **LLM Integration**: Implement `GET /matters/:id/summary` to call an LLM API (e.g., OpenAI/Anthropic/free tier). Use environment variables for API keys and write prompts that yield readable, actionable summaries of logged time.

## Frontend Development Rules (React)
- **Robustness**: Implement strict loading and error states for all asynchronous operations and network requests.
- **Components**: Usable, clean, and mobile-responsive layout.
- **Key Screens**:
  1. Login Screen (authenticates, stores JWT, protects all other routes).
  2. Matter List (shows all matters, open/closed status badge, total time logged).
  3. Matter Detail (displays time entries table, includes an add-entry form, and a button to fetch the AI summary).

## Testing Strategy
- Focus test coverage on **Integration Tests** using Jest and `supertest`.
- Emphasize edge cases: tests verifying validation behavior (e.g., `422`) and authentication errors (`401`) are higher priority than just the happy path.

## Infrastructure & Configuration
- Ensure a single `docker compose up` command correctly orchestrates the PostgreSQL DB, NestJS Backend, and React Frontend in a fully working state natively.
- Provide a comprehensive `.env.example` defining every required environment variable (including the LLM API configuration).
- Keep `README.md` updated with exact setup steps, how to run seeds, and records of any architectural tradeoffs made.

# General Guidelines
- Write clean, maintainable, self documenting code.
- Follow consistent naming conventions and project structure.
- Update .gitignore to exclude sensitive files and unnecessary build artifacts.
- Never erase existing comment texts
- **Always use arrow function syntax** (`const fn = () => {}`) instead of `function` declarations for all standalone functions, React components, hooks, and services. Class methods in NestJS controllers/services are exempt.

## Out of Scope
Skip the following to focus on core constraints:
- Pixel-perfect or heavily polished UI.
- Advanced security hardening beyond standard JWT implementation.
- Pagination or complex filtering on list views.
