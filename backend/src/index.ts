import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { FastifyInstance } from 'fastify';

/**
 * Start the server
 */
async function start(): Promise<void> {
  // Build the application
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const app: FastifyInstance = await buildApp();

  try {
    // Start listening
    await app.listen({ port: env.PORT, host: env.HOST });

    logger.info(`🚀 Server ready at ${env.SWAGGER_SCHEME}://${env.SWAGGER_HOST}`);
    logger.info(
      `📚 API Documentation available at ${env.SWAGGER_SCHEME}://${env.SWAGGER_HOST}/documentation`,
    );
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(err, 'Unhandled rejection');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(err, 'Uncaught exception');
  process.exit(1);
});

// Start the server
void start();
