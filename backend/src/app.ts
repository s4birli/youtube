import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error-handler';
import routes from './routes';

/**
 * Create Express application
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  // Static files for downloaded content
  app.use('/static', express.static(path.join(process.cwd(), 'public')));

  // API Routes
  app.use('/api', routes);

  // Error handler must be registered after routes
  app.use(errorHandler);

  return app;
}

/**
 * Start the Express server
 */
export function startServer(): void {
  const app = createApp();
  const port = env.PORT;
  const host = env.HOST;

  app.listen(port, () => {
    logger.info(`🚀 Server running at http://${host}:${port}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });
}

if (require.main === module) {
  // Only start the server if this file is run directly
  startServer();
}
