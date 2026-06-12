import Razorpay from 'razorpay';
import { env } from './env';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export { razorpay };
export default razorpay;
