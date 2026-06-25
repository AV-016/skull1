import { prisma } from '../config/database';
import logger from './logger';

export async function logAlert(category: string, message: string, stack?: string): Promise<void> {
  try {
    await prisma.alertLog.create({
      data: {
        category,
        message,
        stack
      }
    });
  } catch (err) {
    logger.error('Failed to write alert log to database:', err);
  }
}
