export interface JwtPayload {
  sub: string; // user_id (UUID from Supabase)
  email: string;
  role?: string;
  aud?: string;
  iss?: string;
  iat?: number;
  exp?: number;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };
}
