const { defineConfig } = require('@prisma/config');

/**
 * Prisma configuration.
 * Native JavaScript version for maximum compatibility with the CLI.
 */
const prismaConfig = defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

// Adding directUrl safely
if (prismaConfig.datasource && process.env.DIRECT_URL) {
  prismaConfig.datasource.directUrl = process.env.DIRECT_URL;
}

// Named export for internal use (if needed)
module.exports.prismaConfig = prismaConfig;

// Default export for Prisma CLI
module.exports = prismaConfig;
