import { env } from './env';

/**
 * Simple logger interface
 */
export interface Logger {
  info(message: string, ...meta: unknown[]): void;
  error(error: unknown, message?: string, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  debug(message: string, ...meta: unknown[]): void;
}

/**
 * Simple logger implementation
 */
class SimpleLogger implements Logger {
  private isDevelopment = env.NODE_ENV === 'development';

  info(message: string, ...meta: unknown[]): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, ...meta);
  }

  error(error: unknown, message?: string, ...meta: unknown[]): void {
    const timestamp = new Date().toISOString();
    const errorMsg = message ? `${message}: ${this.formatError(error)}` : this.formatError(error);
    console.error(`[${timestamp}] ERROR: ${errorMsg}`, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, ...meta);
  }

  debug(message: string, ...meta: unknown[]): void {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] DEBUG: ${message}`, ...meta);
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.message} ${error.stack || ''}`;
    }
    return String(error);
  }
}

export const logger = new SimpleLogger();
