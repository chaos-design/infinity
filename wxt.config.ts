import react from '@vitejs/plugin-react';
import { defineConfig } from 'wxt';
import packageJson from './package.json';

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: () => ({
    plugins: [react()],
  }),
  manifest: {
    permissions: ['storage', 'tabs'],
    name: 'Infinity',
    description: 'Infinity Chrome Extension',
    version: packageJson.version,
  },
});
