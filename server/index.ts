import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { initDatabase, seedDatabase } from './db/index.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/document.js';
import sourcesRoutes from './routes/sources.js';
import annotationsRoutes from './routes/annotations.js';
import notesRoutes from './routes/notes.js';
import writingPhaseRoutes from './routes/writing-phase.js';
import adminRoutes from './routes/admin.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const PORT = process.env.PORT || 3000;

/**
 * Create and configure Express app
 */
function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || 'http://localhost:5173'
      : 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/document', documentRoutes);
  app.use('/api/sources', sourcesRoutes);
  app.use('/api', annotationsRoutes); // Handles /api/sources/:sourceId/annotations
  app.use('/api/annotations', annotationsRoutes); // Handles /api/annotations/:id
  app.use('/api/notes', notesRoutes);
  app.use('/api/writing-phase', writingPhaseRoutes);
  app.use('/api/admin', adminRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start server
 */
async function main() {
  try {
    console.log('Initializing BTK Institute v5.2 backend...');

    // Initialize database
    console.log('Setting up database...');
    initDatabase();
    await seedDatabase();
    console.log('Database ready');

    // Create and start server
    const app = createServer();

    app.listen(PORT, () => {
      console.log(`BTK Institute API server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`\nDefault login credentials:`);
      console.log(`  Email: admin@beyondthekeys.ai`);
      console.log(`  Password: admin123`);
      console.log(`\nNOTE: NO AI INTEGRATION - AI buttons are UI placeholders only`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
