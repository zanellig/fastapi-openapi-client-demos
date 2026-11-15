import { fileURLToPath } from 'node:url';

import { defineConfig } from '@hey-api/openapi-ts';

// `pnpm dev` follows the live backend; every other entry point (api:generate,
// build, the Vite plugin during build) reads the committed contract snapshot so
// no backend has to be running.
const isDev = process.env.npm_lifecycle_event === 'dev';
const snapshotPath = fileURLToPath(
  new URL('../../openapi/openapi.json', import.meta.url),
);

export default defineConfig({
  input: isDev
    ? {
        path: 'http://127.0.0.1:8010/openapi.json',
        watch: { enabled: true, interval: 1_500, timeout: 5_000 },
      }
    : { path: snapshotPath, watch: false },
  output: {
    path: './src/api/generated',
    tsConfigPath: './tsconfig.json',
  },
  plugins: [
    '@hey-api/typescript',
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: './src/api/client-config.ts',
    },
    '@hey-api/sdk',
    '@tanstack/react-query',
  ],
});
