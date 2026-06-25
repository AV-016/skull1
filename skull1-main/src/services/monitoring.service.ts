import { prisma } from '../config/database';
import logger from '../utils/logger';

export interface MonitoringStats {
  status: 'healthy' | 'warning' | 'critical';
  counts: {
    errors500: number;
    paymentFailures: number;
    webhookFailures: number;
    smtpFailures: number;
    dbFailures: number;
  };
  recentAlerts: Array<{
    category: string;
    message: string;
    timestamp: string;
  }>;
}

export class MonitoringService {
  async getStats(): Promise<MonitoringStats> {
    let paymentFailures = 0;
    try {
      paymentFailures = await prisma.order.count({
        where: {
          paymentStatus: 'FAILED',
        },
      });
    } catch (dbErr) {
      logger.error('Error counting failed orders in monitoring:', dbErr);
    }

    let errors500 = 0;
    let webhookFailures = 0;
    let smtpFailures = 0;
    let dbFailures = 0;

    try {
      errors500 = await prisma.alertLog.count({ where: { category: '500 Internal Error' } });
      webhookFailures = await prisma.alertLog.count({ where: { category: 'Webhook Verification' } });
      smtpFailures = await prisma.alertLog.count({ where: { category: 'SMTP Delivery' } });
      dbFailures = await prisma.alertLog.count({ where: { category: 'Database / Timeout' } });
    } catch (err) {
      logger.error('Error querying AlertLog counts:', err);
    }

    const recentAlerts: Array<{ category: string; message: string; timestamp: string }> = [];
    try {
      const logs = await prisma.alertLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 15,
      });
      for (const log of logs) {
        recentAlerts.push({
          category: log.category,
          message: log.message,
          timestamp: log.timestamp.toISOString(),
        });
      }
    } catch (err) {
      logger.error('Error querying AlertLog list:', err);
    }

    // Compute status level
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const totalIssues = errors500 + webhookFailures + smtpFailures + dbFailures + paymentFailures;

    if (dbFailures > 0 || errors500 > 10) {
      status = 'critical';
    } else if (totalIssues > 0) {
      status = 'warning';
    }

    return {
      status,
      counts: {
        errors500,
        paymentFailures,
        webhookFailures,
        smtpFailures,
        dbFailures,
      },
      recentAlerts,
    };
  }
}

export default MonitoringService;
