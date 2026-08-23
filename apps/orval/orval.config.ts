import { defineConfig } from 'orval';

export default defineConfig({
  dispatchDesk: {
    input: {
      target: './openapi/openapi.json',
    },
    output: {
      target: './src/api/generated/dispatch-desk.ts',
      schemas: './src/api/generated/models',
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'split',
      baseUrl: 'http://127.0.0.1:8010',
      clean: true,
      override: {
        query: {
          signal: true,
        },
      },
    },
  },
});
