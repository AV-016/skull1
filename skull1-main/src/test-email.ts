import { Resend } from 'resend';
import { env } from './config/env';
import logger from './utils/logger';

const resend = new Resend(env.RESEND_API_KEY);

async function testEmail() {
  logger.info('Testing Resend Email configuration...');
  logger.info(`API Key length: ${env.RESEND_API_KEY ? env.RESEND_API_KEY.length : 0}`);
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['vajpayee016@gmail.com'], // Send to the registered developer email address found in the log tokens
      subject: 'Skulture Test Email',
      html: '<p>If you receive this, the Resend integration is working perfectly! 🎉</p>'
    });

    if (error) {
      logger.error('Resend API returned error:', error);
      process.exit(1);
    }

    logger.info(`Test email sent successfully! Message ID: ${data?.id}`);
  } catch (error: any) {
    logger.error('Failed to run Resend test:', error);
    process.exit(1);
  }
}

testEmail();
