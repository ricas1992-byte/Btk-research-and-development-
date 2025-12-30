import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for CDW client bundle
 *
 * IMPORTANT: Client/Server Separation
 * - Client entry: /src/ui/main.tsx
 * - All client code must be in /src/ui/ directory
 * - NEVER import server-only modules in client code:
 *   - express
 *   - better-sqlite3
 *   - Node.js built-ins (fs, path, etc.) except in Vite config
 * - Use /src/ui/api-client.ts for all server communication
 */
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Ensure server-only packages are not bundled
      external: (id) => {
        const serverOnlyPackages = ['express', 'better-sqlite3'];
        return serverOnlyPackages.some(pkg => id.includes(pkg));
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
