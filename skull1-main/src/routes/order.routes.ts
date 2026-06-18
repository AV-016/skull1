import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createOrderSchema, updateOrderStatusSchema, updateOrderShippingSchema } from '../validators/order.validator';

const router = Router();
const controller = new OrderController();

// 1. Customer Order Routes (/api/orders)
router.use(protect); // All order routes require authentication
router.post('/', validate(createOrderSchema), controller.createOrder);
router.get('/', controller.getMyOrders);
router.get('/:id', controller.getOrderById);
router.post('/:id/cancel', controller.cancelOrder);
router.post('/:id/return', controller.requestReturn);
router.get('/:id/status-history', controller.getOrderHistory);

// 2. Admin Order Routes (Mounted at /api/admin/orders)
export const adminOrderRouter = Router();
adminOrderRouter.use(protect, restrictToAdmin);
adminOrderRouter.get('/', controller.getAllOrders);
adminOrderRouter.get('/:id', controller.getOrderById);
adminOrderRouter.patch('/:id/status', validate(updateOrderStatusSchema), controller.updateOrderStatus);
adminOrderRouter.patch('/:id/shipping', validate(updateOrderShippingSchema), controller.updateOrderShipping);
adminOrderRouter.get('/:id/history', controller.getOrderHistory);

export default router;
