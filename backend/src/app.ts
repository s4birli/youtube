import Fastify from 'fastify';
import { env } from './config/env';
import { logger } from './config/logger';

// Import plugins
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

// Import custom plugins
import downloadTrackerPlugin from './plugins/download-tracker.plugin';

// Import routes
import { registerRoutes } from './routes';

// Import error handler middleware
import { errorHandler } from './middlewares/error-handler';

/**
 * Build the Fastify application
 * Using FastifyInstance for the return type
 */
export async function buildApp(): Promise<ReturnType<typeof Fastify>> {
  // Create Fastify instance
  const app = Fastify({
    logger,
    trustProxy: true,
  });

  // Register plugins
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIMEWINDOW,
  });

  // Register custom plugins
  await app.register(downloadTrackerPlugin, {
    cleanupIntervalMs: 30 * 60 * 1000, // 30 minutes
    maxAgeMs: 24 * 60 * 60 * 1000, // 1 day
  });

  // Register Swagger for API documentation
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'YouTube Downloader API',
        description: 'API for downloading YouTube videos and extracting audio',
        version: '1.0.0',
      },
      host: env.SWAGGER_HOST,
      schemes: [env.SWAGGER_SCHEME],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await app.register(swaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Custom error handler
  app.setErrorHandler(errorHandler);

  // Health check route
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  registerRoutes(app);

  return app;
}
