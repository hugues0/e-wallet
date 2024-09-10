import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';

const config = new DocumentBuilder()
  .addBearerAuth({ type: 'http', scheme: 'bearer' })
  .setTitle('E-Wallet API Docs')
  .setDescription('E-Wallet API documentation')
  .setVersion('1.0.0')
  .build();

const customOptions: SwaggerCustomOptions = {
  customSiteTitle: 'E-Wallet API Doc',
  swaggerOptions: {
    persistAuthorization: true,
  },
};

export const setupSwagger = (app: INestApplication): void => {
  const document = SwaggerModule.createDocument(app, config);
  return SwaggerModule.setup('api-docs', app, document, customOptions);
};
