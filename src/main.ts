import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { logger, setupSwagger } from './common/config';
import { json, urlencoded } from 'express';
import { PORT } from './common/constants';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(logger),
  });

  const log = app.get(Logger);

  /** Catch unhandled rejections
   * @param string
   */
  process.on('unhandledRejection', (e) => {
    log.error(e);
    process.exit(1);
  });

  app.enableCors({ origin: '*' });

  /**
   * Add global prefix '<host>/api/'
   */
  app.setGlobalPrefix('api');

  /**
   * Set up bodyParser and data limit
   */

  /**
   * Set up Swagger documentation
   * @returns void
   */
  setupSwagger(app);

  /**
   * Use global validation pipe
   */
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const result = errors.map((error) => {
          const msg = error?.constraints[Object.keys(error?.constraints)?.[0]];
          const message = msg?.replace(/([A-Z])/g, ' $1').trim();
          const err = {
            property: error.property,
            message:
              message?.[0]?.toUpperCase() +
              message?.slice(1, message?.length)?.toLocaleLowerCase(),
          };
          return err;
        });
        return new BadRequestException(result);
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(json({ limit: '10mb' }));
  app.use(
    urlencoded({ limit: '10mb', extended: true, parameterLimit: 1000000 }),
  );

  /**
   * Set security headers
   */
  app.use(helmet());

  /**
   * Compress the app
   */
  app.use(compression());

  /**
   * Start the app
   * @param port
   * @param callback
   */
  await app.listen(PORT, async () =>
    console.log(`Server is running on port ${PORT}`),
  );
}

bootstrap();
