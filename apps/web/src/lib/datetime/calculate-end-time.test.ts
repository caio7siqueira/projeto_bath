import { describe, expect, it } from 'vitest';
import { calculateEndDateTime } from './calculate-end-time';

describe('calculateEndDateTime', () => {
  it('soma a duração em minutos preservando o formato local', () => {
    expect(calculateEndDateTime('2025-01-05T09:30', 30)).toBe('2025-01-05T10:00');
  });

  it('avança para o dia seguinte quando necessário', () => {
    expect(calculateEndDateTime('2025-03-14T23:45', 30)).toBe('2025-03-15T00:15');
  });

  it('retorna null para entradas inválidas', () => {
    expect(calculateEndDateTime('', 30)).toBeNull();
    expect(calculateEndDateTime('data-invalida', 30)).toBeNull();
    expect(calculateEndDateTime('2025-01-05T09:30', undefined)).toBeNull();
    expect(calculateEndDateTime('2025-01-05T09:30', NaN)).toBeNull();
  });
});
