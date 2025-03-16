import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error(err, `Error on ${req.method} ${req.url}`);

  // Set defaults
  let statusCode = 500;
  let message = 'Internal Server Error';
  let stack: string | undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    stack = err.stack;
  }

  // Send the response
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    stack,
  });
}
