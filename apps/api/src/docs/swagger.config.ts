import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import {
  OpenAPIObject,
  OperationObject,
  PathItemObject,
  ReferenceObject,
  ResponseObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

type SchemaLike = SchemaObject | ReferenceObject;

const SWAGGER_JSON = 'application/json';
const PAGINATION_META_SCHEMA: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'integer', minimum: 1, example: 1, description: 'Página atual (1-based)' },
    pageSize: { type: 'integer', minimum: 0, example: 20, description: 'Itens retornados por página' },
    total: { type: 'integer', minimum: 0, example: 42, description: 'Total de registros encontrados' },
    totalPages: { type: 'integer', minimum: 1, example: 3, description: 'Quantidade total de páginas' },
  },
  required: ['page', 'pageSize', 'total', 'totalPages'],
};

const META_EXAMPLE = {
  page: 1,
  pageSize: 20,
  total: 42,
  totalPages: 3,
};

export const swaggerUiOptions: SwaggerCustomOptions = {
  customSiteTitle: 'Efizion Bath API Docs',
  swaggerOptions: {
    docExpansion: 'none',
    displayRequestDuration: true,
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
};

export function buildSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Efizion Bath API')
    .setDescription(
      'Contratos REST padronizados com envelope `{ data, meta }` para todas as respostas. '
      + 'Use os exemplos fornecidos para alinhar payloads entre frontend e backend.',
    )
    .setVersion('0.1.0')
    .addServer('https://api.efizion.com.br', 'Produção')
    .addServer('http://localhost:3000', 'Local')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Tokens emitidos pelos fluxos /v1/auth ou /v1/customer-auth',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-request-id',
        in: 'header',
        description: 'Opcional. Permite correlação distribuída por request.',
      },
      'x-request-id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  return applyGlobalEnvelope(document);
}

function applyGlobalEnvelope(document: OpenAPIObject): OpenAPIObject {
  ensurePaginationMetaSchema(document);

  const pathItems = Object.values(document.paths ?? {}) as PathItemObject[];
  const methods: Array<keyof PathItemObject> = ['get', 'post', 'put', 'patch', 'delete', 'options'];

  pathItems.forEach(pathItem => {
    methods.forEach(method => {
      const operation = pathItem?.[method] as OperationObject | undefined;
      if (!operation?.responses) {
        return;
      }

      const responses = Object.values(operation.responses) as Array<ResponseObject | ReferenceObject>;
      responses.forEach(response => {
        if (isReferenceObject(response)) {
          return;
        }

        const content = response.content?.[SWAGGER_JSON];
        if (!content?.schema) {
          return;
        }

        if (isEnvelopeSchema(content.schema)) {
          ensureMetaReference(content.schema);
          return;
        }

        const schemaCopy = cloneSchema(content.schema);
        const wrapped = wrapSchema(schemaCopy);
        content.schema = wrapped;
      });
    });
  });

  return document;
}

function wrapSchema(schema: SchemaLike): SchemaObject {
  const isArrayResponse = !isReferenceObject(schema) && schema.type === 'array';
  const dataSchema = schema;
  const base: SchemaObject = {
    type: 'object',
    required: ['data'],
    additionalProperties: false,
    properties: {
      data: dataSchema,
    },
  };

  if (isArrayResponse) {
    base.required?.push('meta');
    base.properties = {
      ...base.properties,
      meta: { $ref: '#/components/schemas/PaginationMeta' },
    };
    base.example = {
      data: extractArrayExample(schema),
      meta: META_EXAMPLE,
    };
    return base;
  }

  base.example = {
    data: extractObjectExample(schema),
  };
  return base;
}

function ensurePaginationMetaSchema(document: OpenAPIObject) {
  if (!document.components) {
    document.components = {};
  }
  if (!document.components.schemas) {
    document.components.schemas = {};
  }
  if (!document.components.schemas.PaginationMeta) {
    document.components.schemas.PaginationMeta = PAGINATION_META_SCHEMA;
  }
}

function ensureMetaReference(schema: SchemaLike) {
  if (isReferenceObject(schema)) {
    return;
  }

  if (schema.properties?.meta) {
    return;
  }

  schema.properties = {
    ...schema.properties,
    meta: { $ref: '#/components/schemas/PaginationMeta' },
  };
  if (!schema.required?.includes('meta')) {
    schema.required = [...(schema.required ?? []), 'meta'];
  }
}

function extractArrayExample(schema: SchemaLike) {
  if (isReferenceObject(schema)) {
    return [];
  }

  if ('example' in schema && schema.example !== undefined) {
    return schema.example;
  }

  if (schema.items) {
    const itemSchema = schema.items as SchemaLike;
    const itemExample = extractObjectExample(itemSchema);
    return [itemExample];
  }

  return [];
}

function extractObjectExample(schema: SchemaLike) {
  if (isReferenceObject(schema)) {
    return {};
  }

  if ('example' in schema && schema.example !== undefined) {
    return schema.example;
  }

  if (schema.properties) {
    const example: Record<string, unknown> = {};
    Object.entries(schema.properties as Record<string, SchemaLike>).forEach(([key, property]) => {
      example[key] = isReferenceObject(property) ? {} : (property as SchemaObject).example ?? null;
    });
    if (Object.keys(example).length > 0) {
      return example;
    }
  }

  return {};
}

function isEnvelopeSchema(schema: SchemaLike): boolean {
  if (isReferenceObject(schema)) {
    return false;
  }

  if (schema.type !== 'object' || !schema.properties) {
    return false;
  }

  return 'data' in schema.properties;
}

function cloneSchema(schema: SchemaLike): SchemaLike {
  if (isReferenceObject(schema)) {
    return { ...schema };
  }

  return JSON.parse(JSON.stringify(schema));
}

function isReferenceObject(value: unknown): value is ReferenceObject {
  return Boolean(value && typeof value === 'object' && '$ref' in value);
}
