import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

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
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Efizion Bath API')
    .setDescription('API docs')
    .setVersion('0.1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-request-id', in: 'header' },
      'x-request-id',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  // Health log
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
