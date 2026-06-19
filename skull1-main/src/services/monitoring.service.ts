import fs from 'fs';
import path from 'path';
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
    const errorLogPath = path.join(__dirname, '../../logs/error.log');
    
    let errors500 = 0;
    let webhookFailures = 0;
    let smtpFailures = 0;
    let dbFailures = 0;
    const recentAlerts: Array<{ category: string; message: string; timestamp: string }> = [];

    // 1. Scan DB for payment failures
    let paymentFailures = 0;
    try {
      paymentFailures = await prisma.order.count({
        where: {
          paymentStatus: 'FAILED',
        },
      });
    } catch (dbErr) {
      logger.error('Error counting failed orders in monitoring:', dbErr);
      dbFailures++;
    }

    // 2. Parse log files if they exist
    if (fs.existsSync(errorLogPath)) {
      try {
        const fileContent = fs.readFileSync(errorLogPath, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        // We only scan the last 1000 lines to prevent performance degradation on large log files
        const maxLinesToScan = 1000;
        const linesToScan = lines.slice(-maxLinesToScan);

        for (const line of linesToScan) {
          try {
            const entry = JSON.parse(line);
            const msg = (entry.message || '').toLowerCase();
            const stack = (entry.stack || '').toLowerCase();
            const timestamp = entry.timestamp || new Date().toISOString();

            let matched = false;
            let category = 'General Error';

            if (msg.includes('status: 500') || stack.includes('status: 500')) {
              errors500++;
              category = '500 Internal Error';
              matched = true;
            }

            if (msg.includes('webhook signature') || stack.includes('webhook signature') || msg.includes('x-razorpay-signature')) {
              webhookFailures++;
              category = 'Webhook Verification';
              matched = true;
            }

            if (msg.includes('smtp') || msg.includes('verification email') || msg.includes('password reset email') || msg.includes('nodemailer') || stack.includes('nodemailer')) {
              smtpFailures++;
              category = 'SMTP Delivery';
              matched = true;
            }

            if (msg.includes('prismaclient') || msg.includes('expired transaction') || msg.includes('connection limit') || msg.includes('transaction api error') || stack.includes('prisma')) {
              dbFailures++;
              category = 'Database / Timeout';
              matched = true;
            }

            if (matched) {
              recentAlerts.push({
                category,
                message: entry.message || entry.stack || 'Logged server exception',
                timestamp,
              });
            }
          } catch (jsonErr) {
            // Ignore malformed log lines
          }
        }
      } catch (fileErr) {
        logger.error('Error reading error log file for monitoring:', fileErr);
      }
    }

    // Keep only the last 15 alerts, ordered newest first
    const sortedAlerts = recentAlerts.reverse().slice(0, 15);

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
      recentAlerts: sortedAlerts,
    };
  }
}

export default MonitoringService;
