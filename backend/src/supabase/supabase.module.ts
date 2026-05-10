import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { ConfigModule } from '../config/config.module';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
