import { Injectable } from '@nestjs/common';
import { AppThrottlerGuard } from '../../common/guards/app-throttler.guard';

@Injectable()
export class ItineraryThrottlerGuard extends AppThrottlerGuard {}
