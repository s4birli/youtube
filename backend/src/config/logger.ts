import pino from 'pino';
import { env } from './env';

// Configure logger based on environment
const transport =
  env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

// Create logger instance
export const logger = pino({
  level: env.LOG_LEVEL,
  transport,
  base: undefined,
  redact: {
    paths: ['password', 'passwordConfirmation', 'authorization', 'req.headers.authorization'],
    censor: '***REDACTED***',
  },
});
