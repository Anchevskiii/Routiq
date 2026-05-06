import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

/**
 * Health check endpoint for monitoring and load balancers.
 * Returns basic application status information.
 */
@Controller('health')
export class HealthController {
  /**
   * Basic health check endpoint.
   * Returns 200 OK when the application is running.
   */
  @Public()
  @Get()
  check() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'routiq-backend',
      version: '1.0.0',
    };
  }
}
