/**
 * Custom application error class
 */
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    /**
     * Create a new AppError
     * @param message Error message
     * @param statusCode HTTP status code (default: 500)
     * @param isOperational Whether the error is expected/operational (default: true)
     */
    constructor(message: string, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);

        // Set the prototype explicitly to maintain instanceof checks
        Object.setPrototypeOf(this, AppError.prototype);
    }
} 