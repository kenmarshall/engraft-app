/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      // Pure TypeScript utility tests — no React Native / Expo dependencies
      displayName: 'utils',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/sm2.test.ts', '<rootDir>/__tests__/cloze.test.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', {
          presets: ['@babel/preset-typescript', ['@babel/preset-env', { targets: { node: 'current' } }]],
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
    },
  ],
};
