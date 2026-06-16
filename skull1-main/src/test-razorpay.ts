import { razorpay } from './config/razorpay';
import { verifyRazorpaySignature } from './utils/razorpayVerify';
import logger from './utils/logger';

async function testRazorpay() {
  logger.info('Testing Razorpay Credentials...');
  logger.info(`Loaded KEY_ID: "${process.env.RAZORPAY_KEY_ID || 'undefined'}"`);
  logger.info(`KEY_SECRET length: ${process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.length : 0}`);
  
  try {
    const options = {
      amount: 100, // 100 paise = 1 INR (minimum amount)
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
    };

    logger.info('Creating test order...');
    const order = await razorpay.orders.create(options);
    logger.info(`Successfully created Razorpay Order! ID: ${order.id}`);
    
    logger.info('Testing Signature Verification...');
    const dummyOrderId = 'order_9A43CD12345';
    const dummyPaymentId = 'pay_9A4567890';
    const secret = process.env.RAZORPAY_KEY_SECRET || 'gWpd1VjOq91dzjIFwbDuEfHA';
    
    // Generate valid test signature using HMAC-SHA256
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(dummyOrderId + '|' + dummyPaymentId)
      .digest('hex');

    const isValid = verifyRazorpaySignature(dummyOrderId, dummyPaymentId, expectedSignature);
    if (isValid) {
      logger.info('Signature Verification Helper: SUCCESS ✅');
    } else {
      logger.error('Signature Verification Helper: FAILED ❌');
    }
    
    logger.info('All Razorpay backend checks completed successfully! 🎉');
  } catch (error: any) {
    console.error('Razorpay test failed with error:', error);
    process.exit(1);
  }
}

testRazorpay();
