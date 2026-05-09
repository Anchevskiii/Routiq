import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

interface PrismaMiddlewareParams {
  model?: string;
  action: string;
  args: {
    where?: Record<string, unknown>;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });

    // @ts-expect-error $use is deprecated in Prisma 5 types but works at runtime
    this.$use(
      async (
        params: PrismaMiddlewareParams,
        next: (params: PrismaMiddlewareParams) => Promise<unknown>,
      ) => {
        const modelsWithSoftDelete = [
          'User',
          'Itinerary',
          'Group',
          'GroupMember',
          'GroupItinerary',
          'Comment',
          'Vote',
        ];

        if (params.model && modelsWithSoftDelete.includes(params.model)) {
          if (params.action === 'findUnique' || params.action === 'findFirst') {
            // findUnique requires unique fields, so we change it to findFirst
            params.action = 'findFirst';
            params.args.where = { ...params.args.where, deletedAt: null };
          }
          if (params.action === 'findMany') {
            if (params.args.where) {
              if (params.args.where.deletedAt === undefined) {
                params.args.where.deletedAt = null;
              }
            } else {
              params.args.where = { deletedAt: null };
            }
          }
          if (params.action === 'update') {
            params.action = 'updateMany';
            params.args.where = { ...params.args.where, deletedAt: null };
          }
          if (params.action === 'updateMany') {
            if (params.args.where) {
              if (params.args.where.deletedAt === undefined) {
                params.args.where.deletedAt = null;
              }
            } else {
              params.args.where = { deletedAt: null };
            }
          }
          if (params.action === 'delete') {
            params.action = 'update';
            params.args.data = { deletedAt: new Date() };
          }
          if (params.action === 'deleteMany') {
            params.action = 'updateMany';
            if (params.args.data !== undefined) {
              params.args.data.deletedAt = new Date();
            } else {
              params.args.data = { deletedAt: new Date() };
            }
          }
        }
        return next(params);
      },
    );
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
