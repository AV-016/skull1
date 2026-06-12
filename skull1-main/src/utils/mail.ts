import { Resend } from 'resend';
import { env } from '../config/env';
import logger from './logger';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  try {
    // If the API key is the default placeholder, log the OTP instead of trying to send it
    if (!env.RESEND_API_KEY || env.RESEND_API_KEY.includes('your_resend_api_key')) {
      logger.warn(`[MAIL MOCK] Resend API key is not configured. Here is the OTP code for ${to} (${name}): ${otp}`);
      console.log(`\n==================================================`);
      console.log(`[EMAIL OTP CODE] for ${to}:`);
      console.log(`Code: ${otp}`);
      console.log(`==================================================\n`);
      return;
    }

    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // Use official Resend sandbox sender
      to: [to], // Pass recipient as an array
      subject: 'Verify Your Email - Skulture',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded-corners: 10px;">
          <h2 style="color: #333333; text-align: center;">Welcome to Skulture!</h2>
          <p style="font-size: 16px; color: #555555;">Hi ${name},</p>
          <p style="font-size: 16px; color: #555555;">Thank you for registering. Please use the following 6-digit verification code to verify your email address:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000000; background-color: #f5f5f5; padding: 10px 20px; border-radius: 5px; border: 1px solid #dddddd;">
              ${otp}
            </span>
          </div>
          
          <p style="font-size: 14px; color: #888888; text-align: center;">This code will expire in 10 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999999; text-align: center;">If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      logger.error(`Error sending email to ${to}:`, error);
      throw new Error(error.message);
    }

    logger.info(`Verification OTP email successfully sent to ${to}. Message ID: ${data?.id}`);
  } catch (err: any) {
    logger.error(`Failed to send verification email to ${to}:`, err);
    // In dev, let's fallback to console log so development is not blocked
    if (env.NODE_ENV === 'development') {
      console.log(`\n==================================================`);
      console.log(`[EMAIL OTP CODE FALLBACK] for ${to} (due to error: ${err.message}):`);
      console.log(`Code: ${otp}`);
      console.log(`==================================================\n`);
    } else {
      throw err;
    }
  }
}
