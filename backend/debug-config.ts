
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ConfigService } from './src/config/config.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  
  const secret = configService.getSupabaseJwtSecret();
  console.log('SUPABASE_JWT_SECRET defined:', !!secret);
  if (secret) {
    console.log('SUPABASE_JWT_SECRET length:', secret.length);
  }
  
  const frontendUrl = configService.getFrontendUrl();
  console.log('FRONTEND_URL:', frontendUrl);
  
  await app.close();
}

bootstrap();
