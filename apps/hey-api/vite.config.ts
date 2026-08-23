import { heyApiPlugin } from '@hey-api/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [heyApiPlugin(), react()],
});
