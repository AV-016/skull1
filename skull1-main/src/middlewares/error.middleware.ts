import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import MESSAGES from '../constants/messages';

export class AppError extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]>;

  constructor(statusCode: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || MESSAGES.COMMON.INTERNAL_SERVER_ERROR;

  // Log the full detailed error trace for operators
  logger.error(`[${req.method}] ${req.path} - Status: ${statusCode} - Error: ${message}`, {
    stack: err.stack,
    errors: err.errors,
  });

  // Security: In production, do not leak raw ORM or database stack trace error messages to clients unless it is a safe custom AppError
  if (process.env.NODE_ENV === 'production' && !(err instanceof AppError)) {
    statusCode = 500;
    message = MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
