import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from './logger';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY as string) : null;

// Initialize NodeMailer transporter if SMTP variables are set
const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  const subject = 'Verify Your Email - Skulture';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
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
  `;

  try {
    const fromAddress = env.EMAIL_FROM_AUTH;
    // 1. Try sending via SMTP if configured
    if (transporter) {
      const from = env.SMTP_FROM_EMAIL || env.SMTP_USER || fromAddress;
      await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });
      logger.info(`Verification OTP email successfully sent via SMTP to ${to} from ${from}.`);
      return;
    }

    // 2. Try sending via Resend if configured
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject,
        html: htmlContent,
      });

      if (error) {
        logger.error(`Resend API returned error for verification email to ${to}:`, error);
        throw new Error(error.message);
      }

      logger.info(`Verification OTP email successfully sent via Resend.`, {
        to,
        from: fromAddress,
        emailId: data?.id,
      });
      return;
    }

    // 3. Mock Fallback (if neither is configured)
    if (env.NODE_ENV === 'development') {
      logger.warn(`[MAIL MOCK] Neither SMTP nor Resend API key is configured. Here is the OTP code for ${to} (${name}): ${otp}`);
      console.log(`\n==================================================`);
      console.log(`[EMAIL OTP CODE] for ${to}:`);
      console.log(`Code: ${otp}`);
      console.log(`==================================================\n`);
    } else {
      logger.warn(`[MAIL MOCK] Neither SMTP nor Resend API key is configured. OTP code hidden in production.`);
    }
  } catch (err: any) {
    logger.error(`Failed to send verification email to ${to} (from: ${env.EMAIL_FROM_AUTH}):`, err);
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

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderNumber: string,
  totalAmount: number
): Promise<void> {
  const subject = `Order Confirmed #${orderNumber} - Skulture`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #333333; text-align: center;">Order Confirmed!</h2>
      <p style="font-size: 16px; color: #555555;">Hi ${name},</p>
      <p style="font-size: 16px; color: #555555;">Thank you for your purchase. We are pleased to confirm your order has been received and is being processed.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #eeeeee;">
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Order Number:</strong> #${orderNumber}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #333333;"><strong>Status:</strong> Confirmed</p>
      </div>
      
      <p style="font-size: 14px; color: #555555;">You can track your order status on your Skulture dashboard.</p>
      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999999; text-align: center;">Thank you for choosing Skulture!</p>
    </div>
  `;

  try {
    const fromAddress = env.EMAIL_FROM_NOREPLY;
    // 1. Try sending via SMTP if configured
    if (transporter) {
      const from = env.SMTP_FROM_EMAIL || env.SMTP_USER || fromAddress;
      await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });
      logger.info(`Order confirmation email successfully sent via SMTP to ${to} from ${from} for Order #${orderNumber}.`);
      return;
    }

    // 2. Try sending via Resend if configured
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject,
        html: htmlContent,
      });

      if (error) {
        logger.error(`Resend API returned error for order confirmation email to ${to}:`, error);
        throw new Error(error.message);
      }

      logger.info(`Order confirmation email successfully sent via Resend.`, {
        to,
        from: fromAddress,
        emailId: data?.id,
        orderNumber,
      });
      return;
    }

    // 3. Mock Fallback (if neither is configured)
    if (env.NODE_ENV === 'development') {
      logger.warn(`[MAIL MOCK] Neither SMTP nor Resend API key is configured. Order confirmation code for ${to} (${name}): #${orderNumber}, total: ₹${totalAmount}`);
      console.log(`\n==================================================`);
      console.log(`[ORDER CONFIRMATION EMAIL] for ${to}:`);
      console.log(`Order: #${orderNumber}`);
      console.log(`Total: ₹${totalAmount}`);
      console.log(`==================================================\n`);
    } else {
      logger.warn(`[MAIL MOCK] Neither SMTP nor Resend API key is configured. Order confirmation suppressed in production logs.`);
    }
  } catch (err: any) {
    logger.error(`Failed to send order confirmation email to ${to} for Order #${orderNumber} (from: ${env.EMAIL_FROM_NOREPLY}):`, err);
    if (env.NODE_ENV === 'development') {
      console.log(`\n==================================================`);
      console.log(`[ORDER CONFIRMATION FALLBACK] for ${to} (due to error: ${err.message}):`);
      console.log(`Order: #${orderNumber}`);
      console.log(`Total: ₹${totalAmount}`);
      console.log(`==================================================\n`);
    } else {
      throw err;
    }
  }
}

export async function sendPasswordResetOtpEmail(to: string, name: string, otp: string): Promise<void> {
  const subject = 'Reset Your Password - Skulture';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #333333; text-align: center;">Reset Your Password</h2>
      <p style="font-size: 16px; color: #555555;">Hi ${name},</p>
      <p style="font-size: 16px; color: #555555;">We received a request to reset your password. Please use the following 6-digit OTP code to complete the reset:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000000; background-color: #f5f5f5; padding: 10px 20px; border-radius: 5px; border: 1px solid #dddddd;">
          ${otp}
        </span>
      </div>
      
      <p style="font-size: 14px; color: #888888; text-align: center;">This code will expire in 10 minutes.</p>
      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999999; text-align: center;">If you did not request a password reset, please ignore this email.</p>
    </div>
  `;

  try {
    const fromAddress = env.EMAIL_FROM_AUTH;
    if (transporter) {
      const from = env.SMTP_FROM_EMAIL || env.SMTP_USER || fromAddress;
      await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });
      logger.info(`Password reset OTP email successfully sent via SMTP to ${to} from ${from}.`);
      return;
    }

    if (resend) {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject,
        html: htmlContent,
      });

      if (error) {
        logger.error(`Resend API returned error for password reset email to ${to}:`, error);
        throw new Error(error.message);
      }

      logger.info(`Password reset OTP email successfully sent via Resend.`, {
        to,
        from: fromAddress,
        emailId: data?.id,
      });
      return;
    }

    // Fallback
    if (env.NODE_ENV === 'development') {
      logger.warn(`[MAIL MOCK] Neither SMTP nor Resend API key is configured. Password reset OTP code for ${to} (${name}): ${otp}`);
      console.log(`\n==================================================`);
      console.log(`[PASSWORD RESET OTP CODE] for ${to}:`);
      console.log(`Code: ${otp}`);
      console.log(`==================================================\n`);
    } else {
      logger.warn(`[MAIL MOCK] Neither SMTP nor Resend API key is configured. Password reset OTP code hidden in production.`);
    }
  } catch (err: any) {
    logger.error(`Failed to send password reset email to ${to} (from: ${env.EMAIL_FROM_AUTH}):`, err);
    if (env.NODE_ENV === 'development') {
      console.log(`\n==================================================`);
      console.log(`[PASSWORD RESET OTP CODE FALLBACK] for ${to} (due to error: ${err.message}):`);
      console.log(`Code: ${otp}`);
      console.log(`==================================================\n`);
    } else {
      throw err;
    }
  }
}
