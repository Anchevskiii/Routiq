import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { AttractionsController } from './attractions.controller';
import { AttractionsService } from './attractions.service';

@Module({
  imports: [ConfigModule],
  controllers: [AttractionsController],
  providers: [AttractionsService],
  exports: [AttractionsService],
})
export class AttractionsModule {}

// Re-export types for consumers
export type { FormattedPlace } from './types';
