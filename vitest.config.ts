import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    clearMocks: true,
    restoreMocks: true,

    pool: 'forks',

    testTimeout: 60000,
    hookTimeout: 10000,

    include: [
      'tests/**/*.test.ts',
    ],

    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/backend-compat/**',
      'tests/context/context.test.ts',
      'tests/crypto/crypto.test.ts',
      'tests/decorators/decision.test.ts',
      'tests/decorators/tool.test.ts',
      'tests/pipeline/buffer.test.ts',
      'tests/transport/transport.test.ts',
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        'tests/backend-compat/**',
      ],
    },
  },
});