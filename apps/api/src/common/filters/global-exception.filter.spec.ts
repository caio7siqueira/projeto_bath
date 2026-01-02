import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  it('deve formatar HttpException em envelope padronizado', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createMockHost();

    filter.catch(new BadRequestException(['startsAt deve ser menor que endsAt']), host);

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchObject({
      code: 'ERR_BAD_REQUEST',
      message: expect.any(String),
      details: {
        fields: ['startsAt deve ser menor que endsAt'],
        path: '/test',
        method: 'POST',
      },
    });
  });

  it('deve normalizar erros do Prisma (P2002)', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createMockHost();
    const prismaError = Object.create(
      Prisma.PrismaClientKnownRequestError.prototype,
    ) as Prisma.PrismaClientKnownRequestError;
    Object.assign(prismaError, {
      code: 'P2002',
      meta: { target: ['slug'] },
      message: 'Unique constraint failed on the fields: (`slug`)',
    });

    filter.catch(prismaError, host);

    expect(response.statusCode).toBe(HttpStatus.CONFLICT);
    expect(response.body).toMatchObject({
      code: 'ERR_DUPLICATE_VALUE',
      details: {
        campos: ['slug'],
        path: '/test',
        method: 'POST',
      },
    });
  });
});

function createMockHost() {
  const response = {
    statusCode: 0,
    body: undefined as any,
  };

  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        url: '/test',
        method: 'POST',
        headers: {},
      }),
      getResponse: () => ({
        status: (statusCode: number) => {
          response.statusCode = statusCode;
          return {
            json: (payload: any) => {
              response.body = payload;
              return payload;
            },
          };
        },
      }),
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}
