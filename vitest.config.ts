import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    // Only run OUR tests
    include: [
      'tests/**/*.test.ts',
    ],

    // Never run dependency tests
    exclude: [
      '**/node_modules/**',
      '**/dist/**',

      // Disabled integration tests
      'tests/backend-compat/**',

      // Disabled legacy tests
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