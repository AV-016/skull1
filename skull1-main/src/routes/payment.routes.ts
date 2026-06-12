import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';

const router = Router();
const controller = new PaymentController();

// 1. Razorpay Payment Routes (/api/payments)
router.post('/create-order', protect, controller.createOrder);
router.post('/verify', protect, controller.verify);
router.post('/webhook', controller.webhook); // Public webhook endpoint

// 2. Admin Payment Log Routes (Mounted at /api/admin/payments)
export const adminPaymentRouter = Router();
adminPaymentRouter.use(protect, restrictToAdmin);
adminPaymentRouter.get('/', controller.getAllPayments);
adminPaymentRouter.get('/:id', controller.getPaymentById);

export default router;
