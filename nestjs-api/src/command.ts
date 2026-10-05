import { CommandFactory } from 'nest-commander';
import { CommandModule } from './command.module.js';
async function bootstrap() {
  await CommandFactory.run(CommandModule, ['warn', 'error', 'log']);
}

bootstrap();