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

The tests use the connection in `.env.test`:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/routiq_test
DIRECT_URL=postgresql://postgres:postgres@localhost:5433/routiq_test
```

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

If you see warnings about missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`,
add dummy values to `.env.test` to silence them. The e2e tests do not use
Supabase during test runs.
