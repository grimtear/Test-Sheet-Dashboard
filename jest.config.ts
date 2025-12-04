import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/client/src', '<rootDir>/server'],
    testMatch: [
        '**/__tests__/**/*.{ts,tsx}',
        '**/*.{spec,test}.{ts,tsx}'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/client/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    collectCoverageFrom: [
        'client/src/**/*.{ts,tsx}',
        'server/**/*.{ts}',
        '!client/src/**/*.d.ts',
        '!client/src/main.tsx',
        '!client/src/vite-env.d.ts',
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                jsx: 'react-jsx',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                types: ['jest', '@testing-library/jest-dom', 'node'],
                isolatedModules: true,
            },
        }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default config;
