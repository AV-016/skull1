import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import MESSAGES from '../constants/messages';
import { logAlert } from '../utils/alertLogger';

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

  // Log critical errors to AlertLog in database
  if (statusCode === 500 || message.toLowerCase().includes('webhook signature') || message.toLowerCase().includes('x-razorpay-signature')) {
    let category = '500 Internal Error';
    const errText = `${message} ${err.stack || ''}`.toLowerCase();

    if (message.toLowerCase().includes('webhook signature') || message.toLowerCase().includes('x-razorpay-signature')) {
      category = 'Webhook Verification';
    } else if (errText.includes('prismaclient') || errText.includes('expired transaction') || errText.includes('connection limit') || errText.includes('transaction api error') || errText.includes('prisma')) {
      category = 'Database / Timeout';
    } else if (errText.includes('smtp') || errText.includes('verification email') || errText.includes('password reset email') || errText.includes('nodemailer') || errText.includes('resend')) {
      category = 'SMTP Delivery';
    }

    logAlert(category, `[${req.method}] ${req.path} - Status: ${statusCode} - Error: ${message}`, err.stack);
  }

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
