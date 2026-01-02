import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { buildSwaggerDocument, swaggerUiOptions } from './docs/swagger.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS_ORIGIN pode ser string única ou lista separada por vírgula
  // Exemplo: CORS_ORIGIN=https://pet.efizion.com.br,http://localhost:3000,http://localhost:3001
  const envOrigins = process.env.CORS_ORIGIN;
  const fallbackOrigins = [
    'https://pet.efizion.com.br',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  // Regex para *.app.github.dev (Codespaces)
  const codespacesRegex = /\.app\.github\.dev$/;
  // Normaliza e filtra origens
  const allowedOrigins = (envOrigins
    ? envOrigins.split(',').map(o => o.trim()).filter(Boolean)
    : fallbackOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Permite requests sem Origin (curl, healthcheck, server-to-server)
      if (!origin) return callback(null, true);
      // Permite se origin está na lista
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Permite *.app.github.dev
      if (codespacesRegex.test(origin)) return callback(null, true);
      // Bloqueia demais
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    credentials: true,
  });
  
  app.setGlobalPrefix('v1', {
    exclude: ['/'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor(), new ApiResponseInterceptor());

  const document = buildSwaggerDocument(app);
  SwaggerModule.setup('docs', app, document, swaggerUiOptions);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  // Health log
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
