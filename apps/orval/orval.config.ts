import { defineConfig } from 'orval';

export default defineConfig({
  dispatchDesk: {
    input: {
      // Committed contract snapshot exported by backend/scripts/export_openapi.py.
      target: '../../openapi/openapi.json',
    },
    output: {
      target: './src/api/generated/dispatch-desk.ts',
      schemas: './src/api/generated/models',
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'split',
      // Baked into the generated client at generation time, not read at runtime.
      baseUrl: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8010',
      clean: true,
      override: {
        query: {
          signal: true,
        },
      },
    },
  },
});
