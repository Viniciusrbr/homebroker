import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AssetsService } from './assets/assets.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const assetsService = app.get(AssetsService);
  assetsService.subscribeNewPriceChangedEvents().subscribe((event) => {
    console.log(event);
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
