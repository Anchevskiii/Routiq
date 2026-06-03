import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ─── Soft-delete configuration ────────────────────────────────────────────────
const SOFT_DELETE_MODELS: ReadonlySet<string> = new Set([
  'User',
  'Itinerary',
  'ItineraryDay',
  'ItineraryActivity',
  'Group',
  'GroupMember',
  'GroupItinerary',
  'Comment',
  'Vote',
]);

// ─── Internal helper ──────────────────────────────────────────────────────────
// Merges `deletedAt: null` into the `where` clause of any Prisma args object.
// We cast through `unknown` because `$allModels` query hooks operate over a
// union of all possible model arg types. TypeScript cannot verify that every
// union member has a `deletedAt` field — we guard with `SOFT_DELETE_MODELS`
// at runtime instead.
function withNotDeleted<T extends { where?: Record<string, unknown> }>(
  args: T,
): T {
  return { ...args, where: { ...args.where, deletedAt: null } };
}

// ─── Prisma client factory ────────────────────────────────────────────────────
// Prisma 7 removed the $use middleware API. Prisma Extensions are the
// supported replacement. We use a standalone factory function so the type
// is cleanly inferred without class-level gymnastics.
function createExtendedClient(pool: Pool) {
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter }).$extends({
    query: {
      $allModels: {
        // ── Read / update: scope to non-deleted rows ─────────────────────────

        async findFirst({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            // Cast is safe: model is confirmed to have `deletedAt`
            return query(
              withNotDeleted(
                args as unknown as { where?: Record<string, unknown> },
              ) as typeof args,
            );
          }
          return query(args);
        },

        async findMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            return query(
              withNotDeleted(
                args as unknown as { where?: Record<string, unknown> },
              ) as typeof args,
            );
          }
          return query(args);
        },

        async update({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            return query(
              withNotDeleted(
                args as unknown as { where?: Record<string, unknown> },
              ) as typeof args,
            );
          }
          return query(args);
        },

        async updateMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            return query(
              withNotDeleted(
                args as unknown as { where?: Record<string, unknown> },
              ) as typeof args,
            );
          }
          return query(args);
        },

        // ── Delete: convert to soft-delete ───────────────────────────────────

        /**
         * Instead of hard-deleting, set deletedAt = now().
         * `Prisma.getExtensionContext(this)` returns the current model delegate
         * so we can call `.updateMany` on the same model.
         */
        async delete({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            const client = Prisma.getExtensionContext(this) as PrismaClient;
            const delegateKey = model.charAt(0).toLowerCase() + model.slice(1);
            const ctx = (
              client as unknown as Record<
                string,
                {
                  updateMany(updateArgs: {
                    where: Record<string, unknown>;
                    data: { deletedAt: Date };
                  }): Prisma.PrismaPromise<{ count: number }>;
                }
              >
            )[delegateKey];
            if (!ctx?.updateMany) {
              return query(args);
            }
            const typedArgs = args as { where?: Record<string, unknown> };
            await ctx.updateMany({
              where: { ...typedArgs.where, deletedAt: null },
              data: { deletedAt: new Date() },
            });
            return {} as Awaited<ReturnType<typeof query>>;
          }
          return query(args);
        },

        async deleteMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            const client = Prisma.getExtensionContext(this) as PrismaClient;
            const delegateKey = model.charAt(0).toLowerCase() + model.slice(1);
            const ctx = (
              client as unknown as Record<
                string,
                {
                  updateMany(updateArgs: {
                    where: Record<string, unknown>;
                    data: { deletedAt: Date };
                  }): Prisma.PrismaPromise<{ count: number }>;
                }
              >
            )[delegateKey];
            if (!ctx?.updateMany) {
              return query(args);
            }
            const typedArgs = args as { where?: Record<string, unknown> };
            return ctx.updateMany({
              where: { ...typedArgs.where, deletedAt: null },
              data: { deletedAt: new Date() },
            }) as Prisma.PrismaPromise<Awaited<ReturnType<typeof query>>>;
          }
          return query(args);
        },
      },
    },
  });
}

// ─── Exported types for use in other services ─────────────────────────────────
export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

/**
 * The `tx` client type for use inside `$transaction` callbacks.
 *
 * @example
 * private async doSomethingInTransaction(tx: TransactionClient) { ... }
 */
export type TransactionClient = Parameters<
  Parameters<ExtendedPrismaClient['$transaction']>[0]
>[0];

// ─── PrismaService ─────────────────────────────────────────────────────────────
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private readonly extendedClient: ExtendedPrismaClient;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    this.pool = new Pool({ connectionString });
    this.extendedClient = createExtendedClient(this.pool);
  }

  async onModuleInit(): Promise<void> {
    await this.extendedClient.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.extendedClient.$disconnect();
    await this.pool.end();
    this.logger.log('Database connection closed');
  }

  // ─── Model accessors ────────────────────────────────────────────────────────
  // Delegate to the extended client so all queries are intercepted by the
  // soft-delete extension automatically.

  get user() {
    return this.extendedClient.user;
  }
  get itinerary() {
    return this.extendedClient.itinerary;
  }
  get itineraryDay() {
    return this.extendedClient.itineraryDay;
  }
  get itineraryActivity() {
    return this.extendedClient.itineraryActivity;
  }
  get itineraryWeatherSnapshot() {
    return this.extendedClient.itineraryWeatherSnapshot;
  }
  get itineraryTip() {
    return this.extendedClient.itineraryTip;
  }
  get group() {
    return this.extendedClient.group;
  }
  get groupMember() {
    return this.extendedClient.groupMember;
  }
  get groupItinerary() {
    return this.extendedClient.groupItinerary;
  }
  get comment() {
    return this.extendedClient.comment;
  }
  get commentReaction() {
    return this.extendedClient.commentReaction;
  }
  get vote() {
    return this.extendedClient.vote;
  }

  get activityLog() {
    return this.extendedClient.activityLog;
  }
  get calendarExport() {
    return this.extendedClient.calendarExport;
  }

  get notification() {
    return this.extendedClient.notification;
  }

  // ─── Transaction ────────────────────────────────────────────────────────────
  // Exposes $transaction bound to the extended client. The `tx` client passed
  // into the callback is an interactive-transaction-scoped extended client, so
  // the soft-delete extension hooks still apply within transactions.

  get $transaction() {
    return this.extendedClient.$transaction.bind(
      this.extendedClient,
    ) as ExtendedPrismaClient['$transaction'];
  }
}
