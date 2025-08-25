// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // so you can use describe/it/expect without import
    environment: 'node', // we’re testing backend code
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'], // html report in coverage/index.html
    },
    include: ['tests/**/*.test.ts'], // where your test files are
  },
});
