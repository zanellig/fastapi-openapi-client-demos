import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './experiments/reserved-keywords.openapi.json',
  output: './experiments/generated',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/client-fetch',
    '@hey-api/sdk',
  ],
});
