import crypto from 'crypto';
import { env } from '../config/env';

export const verifyRazorpaySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean => {
  const secret = env.RAZORPAY_KEY_SECRET || 'dummy_secret';
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

export const verifyWebhookSignature = (
  payload: string,
  signature: string
): boolean => {
  const secret = env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return expectedSignature === signature;
};
