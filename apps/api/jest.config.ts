import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/*.module.ts', '!src/**/dto/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: '../../coverage/apps-api-unit',
  coverageReporters: ['text', 'lcov'],
  clearMocks: true,
};

export default config;
