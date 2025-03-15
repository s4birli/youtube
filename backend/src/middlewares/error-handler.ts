import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Custom error types
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errorCode?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Type guard to check if error has validation property
 */
interface ValidationError {
  validation: Array<{
    keyword: string;
    dataPath: string;
    schemaPath: string;
    params: Record<string, unknown>;
    message: string;
  }>;
  statusCode?: number;
}

function isValidationError(error: unknown): error is ValidationError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'validation' in error &&
    Array.isArray((error as ValidationError).validation)
  );
}

/**
 * Type guard to check if error has statusCode property
 */
function hasStatusCode(error: unknown): error is { statusCode: number } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number'
  );
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: FastifyError | Error | ZodError | AppError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  // Log the error
  logger.error(error);

  // Handle ZodError (validation errors)
  if (error instanceof ZodError) {
    void reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.format(),
      statusCode: 400,
    });
    return;
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    void reply.status(error.statusCode).send({
      error: error.errorCode || 'Error',
      message: error.message,
      statusCode: error.statusCode,
    });
    return;
  }

  // Handle Fastify validation errors
  if (isValidationError(error)) {
    void reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.validation,
      statusCode: 400,
    });
    return;
  }

  // Handle generic errors (different for prod vs dev)
  if (env.NODE_ENV === 'production') {
    // Don't expose error details in production
    void reply.status(500).send({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500,
    });
    return;
  }

  // In development, return more detailed error
  const statusCode = hasStatusCode(error) ? error.statusCode : 500;

  void reply.status(statusCode).send({
    error: error.name || 'Error',
    message: error.message || 'An unexpected error occurred',
    stack: error.stack,
    statusCode: statusCode,
  });
}
