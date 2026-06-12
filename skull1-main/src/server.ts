import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import logger from './utils/logger';

const PORT = env.PORT;

const startServer = async () => {
  try {
    // Test database connection
    logger.info('Connecting to database...');
    await prisma.$connect();
    logger.info('Database connected successfully.');

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await prisma.$disconnect();
        logger.info('Database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
