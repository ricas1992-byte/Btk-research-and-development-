import { createServer } from './api/server.js';
import { initDatabase } from './persistence/database.js';
import { config } from './config.js';

/**
 * Main entry point for the CDW server.
 */

async function main() {
  // Initialize database
  console.log('Initializing database...');
  initDatabase();
  console.log('Database ready');

  // Create and start server
  const app = createServer();
  const port = config.port;

  app.listen(port, () => {
    console.log(`CDW API server running on http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
