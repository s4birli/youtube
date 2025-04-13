import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error-handler';
import routes from './routes';

/**
 * Create Express application
 */
export function createApp(): Express {
  const app = express();

  // Configure CORS - more permissive configuration
  app.use(cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'Content-Disposition'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));

  // Handle preflight requests explicitly
  app.options('*', cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    maxAge: 86400
  }));

  // Middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource sharing
    contentSecurityPolicy: false // Disable CSP for development
  }));
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
