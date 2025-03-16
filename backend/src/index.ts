import { startServer } from './app';
import { logger } from './config/logger';

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error(error, 'Uncaught Exception');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', reason => {
  logger.error(reason, 'Unhandled Rejection');
  process.exit(1);
});

// Start the server
startServer();
