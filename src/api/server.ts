import express from 'express';
import { errorHandler } from './error-handler.js';
import { projectRouter } from './routes/project.js';
import { ideasRouter } from './routes/ideas.js';
import { phasesRouter } from './routes/phases.js';
import { documentsRouter } from './routes/documents.js';
import { decisionsRouter } from './routes/decisions.js';
import { tasksRouter } from './routes/tasks.js';
import { opsRouter } from './routes/ops.js';

/**
 * Creates and configures the Express application.
 */

export function createServer(): express.Application {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/project', projectRouter);
  app.use('/api/ideas', ideasRouter);
  app.use('/api/phases', phasesRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/decisions', decisionsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/ops', opsRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
