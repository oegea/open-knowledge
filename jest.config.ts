import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

export default async (): Promise<Config> => {
  const backend = await createJestConfig({
    displayName: 'backend',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/modules/**/test/**/*.test.ts'],
    moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  })();

  const frontend = await createJestConfig({
    displayName: 'frontend',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/__tests__/**/*.test.ts?(x)'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  })();

  return {
    coverageProvider: 'v8',
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'json-summary'],
    testPathIgnorePatterns: ['.*Mother\\.ts$'],
    projects: [backend, frontend],
  };
};
