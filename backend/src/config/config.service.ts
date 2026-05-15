import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private readonly configService: NestConfigService) {
    this.logger.log(
      `AppConfigService initialized. CORS_ORIGIN: ${this.configService.get('CORS_ORIGIN')}`,
    );
  }

  get<T = unknown>(key: string): T | undefined {
    return this.configService.get<T>(key) ?? (process.env[key] as unknown as T);
  }

  getDatabaseUrl(): string {
    return this.get<string>('DATABASE_URL')!;
  }

  getSupabaseJwtSecret(): string {
    return this.get<string>('SUPABASE_JWT_SECRET')!;
  }

  getSupabaseUrl(): string {
    return this.get<string>('SUPABASE_URL')!;
  }

  getSupabaseServiceRoleKey(): string {
    return this.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;
  }

  getGeminiApiKey(): string {
    return this.get<string>('GEMINI_API_KEY') ?? '';
  }

  getGooglePlacesApiKey(): string {
    return this.get<string>('GOOGLE_PLACES_API_KEY') ?? '';
  }

  getGoogleMapsDirectionsApiKey(): string {
    return this.get<string>('GOOGLE_MAPS_DIRECTIONS_API_KEY') ?? '';
  }

  getGoogleWeatherApiKey(): string {
    return this.get<string>('GOOGLE_WEATHER_API_KEY') ?? '';
  }

  getSpotifyClientId(): string {
    return this.get<string>('SPOTIFY_CLIENT_ID') ?? '';
  }

  getSpotifyClientSecret(): string {
    return this.get<string>('SPOTIFY_CLIENT_SECRET') ?? '';
  }

  getFrontendUrl(): string {
    return this.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  getAllowedOrigins(): string[] {
    const corsOrigin = this.get<string>('CORS_ORIGIN');
    if (corsOrigin) {
      return corsOrigin.split(',').map((o) => o.trim());
    }
    return [this.getFrontendUrl()];
  }

  getBackendUrl(): string {
    return this.get<string>('BACKEND_URL') || 'http://localhost:3000';
  }

  getPort(): number {
    return this.get<number>('PORT') || 3000;
  }

  getNodeEnv(): string {
    return this.get<string>('NODE_ENV') || 'development';
  }

  isDevelopment(): boolean {
    return this.getNodeEnv() === 'development';
  }

  isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }
}
