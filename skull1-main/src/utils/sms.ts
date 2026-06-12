import { env } from '../config/env';
import logger from './logger';

export async function sendOtpSms(to: string, otp: string): Promise<void> {
  try {
    const apiKey = env.FAST2SMS_API_KEY;

    if (!apiKey || apiKey.includes('your_fast2sms_api_key') || apiKey === '') {
      logger.warn(`[SMS MOCK] Fast2SMS API key is not configured. Here is the OTP code for ${to}: ${otp}`);
      console.log(`\n==================================================`);
      console.log(`[SMS OTP CODE] for ${to}:`);
      console.log(`Code: ${otp}`);
      console.log(`==================================================\n`);
      return;
    }

    // Fast2SMS URL configuration for OTP route
    // We send via variables_values which contains our OTP, numbers is comma separated numbers.
    const url = `https://www.fast2sms.com/dev/bulkV2`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variables_values: otp,
        route: 'otp',
        numbers: to.startsWith('+91') ? to.slice(3) : (to.startsWith('91') && to.length === 12 ? to.slice(2) : to.replace(/\+/g, '')),
      }),
    });

    const responseData = (await response.json()) as any;

    if (!response.ok || !responseData.return) {
      logger.error(`Error sending SMS via Fast2SMS to ${to}:`, responseData);
      throw new Error(responseData.message || 'Failed to send SMS');
    }

    logger.info(`SMS verification OTP sent to ${to}. Fast2SMS request ID: ${responseData.request_id}`);
  } catch (err: any) {
    logger.error(`Failed to send SMS to ${to}:`, err);
    // In dev, let's fallback to console log so development is not blocked
    if (env.NODE_ENV === 'development') {
      console.log(`\n==================================================`);
      console.log(`[SMS OTP CODE FALLBACK] for ${to} (due to error: ${err.message}):`);
      console.log(`Code: ${otp}`);
      console.log(`==================================================\n`);
    } else {
      throw err;
    }
  }
}
