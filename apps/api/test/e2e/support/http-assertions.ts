import type { Response } from 'supertest';

export function expectData<T = any>(res: Response): T {
  expect(res.body).toBeDefined();
  expect(res.body).toHaveProperty('data');
  return res.body.data as T;
}

export function expectList<T = any>(res: Response): T[] {
  const data = expectData<T[]>(res);
  expect(Array.isArray(data)).toBe(true);
  expect(res.body).toHaveProperty('meta');
  return data;
}

export function expectMeta(res: Response) {
  expect(res.body).toHaveProperty('meta');
  return res.body.meta;
}

export function expectError(res: Response, expectedCode?: string) {
  expect(res.body).toBeDefined();
  expect(res.body).toHaveProperty('code');
  expect(res.body).toHaveProperty('message');
  if (expectedCode) {
    expect(res.body.code).toBe(expectedCode);
  }
  return res.body;
}