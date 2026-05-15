
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AttractionsService } from '../src/attractions/attractions.service';
import { TravelType } from '@prisma/client';

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const attractionsService = app.get(AttractionsService);

  try {
    console.log('Testing AttractionsService.getCuratedPlaces...');
    const places = await attractionsService.getCuratedPlaces('London', 'CULTURAL' as TravelType, 3);
    console.log(`Found ${places.length} places.`);
    console.log(JSON.stringify(places.slice(0, 2), null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await app.close();
  }
}

test();
