import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Root vite config - points to research-app
export default defineConfig({
  root: './research-app',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './research-app/src'),
      '@shared': path.resolve(__dirname, './research-app/shared'),
    },
  },
  server: {
    port: 5173,
  },
});
