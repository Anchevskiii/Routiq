# Backend Tests

This folder contains integration and e2e tests for the Routiq backend.

## Prerequisites

- Node.js 20+
- Docker (recommended) or a local PostgreSQL instance
- Run commands from the backend/ directory

## Local test database (Docker)

First-time setup:

```bash
docker run --name routiq-test-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=routiq_test -p 5433:5432 -d postgres:16
```

Start or stop the DB later:

```bash
docker start routiq-test-db
docker stop routiq-test-db
```

Copy the test environment template before your first local run:

```bash
cp .env.test.example .env.test
```

The tests use the connection in `.env.test` (see `.env.test.example` for all test-only variables).

## Migrations for the test DB

Apply existing migrations to the test DB:

```bash
npx prisma migrate deploy
```

Reset the test DB (destructive):

```bash
npx prisma migrate reset
```

## Running tests

```bash
npm run test           # unit tests
npm run test:integration
npm run test:e2e
```

## Supabase warnings during tests

Dummy Supabase values are included in `.env.test.example`. Backend tests do not
call Supabase during test runs.
