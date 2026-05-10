const path = require('path');

// Load environment variables before anything else
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { defineConfig } = require('@prisma/config');

/**
 * Prisma 7 configuration.
 *
 * - `url`: Used by Prisma CLI for migrations. Points to the DIRECT connection
 *   (port 5432) to avoid PgBouncer issues with DDL statements.
 * - Runtime uses PrismaPg adapter configured in PrismaService.
 */
module.exports = defineConfig({
  datasource: {
    // For migrations, use DIRECT_URL (bypasses PgBouncer)
    url: process.env.DIRECT_URL,
  },
});
