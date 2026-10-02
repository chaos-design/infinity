import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // Several specs deliberately render a component several times in one case
    // to cover a full interaction arc. jsdom plus testing-library cannot finish
    // those inside the 5s default. Assertion failures still fail immediately;
    // this only widens the budget for slow-but-correct specs.
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: ['hooks/use-tabs.ts', 'components/tab-manager.tsx'],
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
