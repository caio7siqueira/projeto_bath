import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { stringify } from 'yaml';
import { AppModule } from '../app.module';
import { buildSwaggerDocument } from './swagger.config';

async function generateOpenApiBundle() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  const document = buildSwaggerDocument(app);
  const outputDir = resolve(__dirname, '../../../../docs/openapi');
  await mkdir(outputDir, { recursive: true });

  const jsonPath = join(outputDir, 'openapi.json');
  const yamlPath = join(outputDir, 'openapi.yaml');

  await writeFile(jsonPath, JSON.stringify(document, null, 2));
  await writeFile(yamlPath, stringify(document));

  await app.close();

  // eslint-disable-next-line no-console
  console.log('Bundle OpenAPI gerado:', jsonPath, 'e', yamlPath);
}

generateOpenApiBundle().catch(error => {
  // eslint-disable-next-line no-console
  console.error('[openapi] erro ao gerar bundle', error);
  process.exit(1);
});
