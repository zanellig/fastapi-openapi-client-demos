import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: {
    path: 'http://127.0.0.1:8010/openapi.json',
    watch:
      process.env.npm_lifecycle_event === 'dev'
        ? { enabled: true, interval: 1_500, timeout: 5_000 }
        : false,
  },
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
  ],
});
