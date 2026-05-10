import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private clientInstance?: SupabaseClient;

  constructor(private readonly configService: AppConfigService) {
    const supabaseUrl = this.configService.getSupabaseUrl();
    const supabaseKey = this.configService.getSupabaseServiceRoleKey();

    this.logger.log(`Initializing Supabase client with URL: ${supabaseUrl}`);

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        'Supabase URL or Service Role Key is missing in environment variables',
      );
      return;
    }

    this.clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: fetch as unknown as typeof fetch,
      },
      realtime: {
        transport: ws as unknown as undefined,
      },
    } as unknown as Record<string, unknown>);
  }

  getClient(): SupabaseClient | undefined {
    return this.clientInstance;
  }
}
