import { config } from 'dotenv';
import * as path from 'path';

// Load test environment variables from .env.test (copy from .env.test.example)
config({ path: path.resolve(__dirname, '../.env.test') });

process.env.NODE_ENV = 'test';

// Local Docker test DB defaults — CI overrides via workflow env vars
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5433/routiq_test';
process.env.DIRECT_URL =
  process.env.DIRECT_URL ||
  'postgresql://postgres:postgres@localhost:5433/routiq_test';

// Test-only fallbacks; copy backend/.env.test.example to .env.test for local runs
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-local-only';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-local-only';
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://example.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'fake-supabase-service-role-key-not-a-real-jwt';
process.env.SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET || 'fake-supabase-jwt-secret-local-only';

jest.setTimeout(30000);
