// Express Router for Payment Endpoints
import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';

const router = Router();
const controller = new PaymentController();

// ==========================================
// 1. Razorpay Payment Routes (Mounted at /api/payments)
// ==========================================

// Endpoint to create a new Razorpay order session. Requires user authentication.
router.post('/create-order', protect, controller.createOrder);

// Endpoint to verify the Razorpay payment signature after a successful user checkout transaction. Requires user authentication.
router.post('/verify', protect, controller.verify);

// Public Webhook endpoint for Razorpay to push status events (like payment.captured, payment.failed) asynchronously.
router.post('/webhook', controller.webhook); 

// ==========================================
// 2. Admin Payment Log Routes (Mounted at /api/admin/payments)
// ==========================================
export const adminPaymentRouter = Router();

// Secure admin payment routes. Only accessible by authenticated administrators.
adminPaymentRouter.use(protect, restrictToAdmin);

// Retrieve a paginated list of all payment logs.
adminPaymentRouter.get('/', controller.getAllPayments);

// Retrieve a specific payment log by its ID.
adminPaymentRouter.get('/:id', controller.getPaymentById);

export default router;
