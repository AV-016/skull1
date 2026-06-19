import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';

// Import admin sub-routers
import { adminCategoryRouter } from './category.routes';
import { adminProductRouter, adminTagRouter } from './product.routes';
import { adminOrderRouter } from './order.routes';
import { adminPaymentRouter } from './payment.routes';
import { adminReviewRouter } from './review.routes';
import { adminCustomRequestRouter } from './customRequest.routes';
import { adminQuotationRouter } from './quotation.routes';
import { adminInquiryRouter } from './inquiry.routes';
import { adminDashboardRouter } from './dashboard.routes';
import { adminEventRouter } from './event.routes';
import adminMonitoringRouter from './monitoring.routes';

const router = Router();
const controller = new AdminController();

// Secure all admin routes with auth and role verification
router.use(protect, restrictToAdmin);

// 1. Settings Endpoints (/api/admin/settings)
router.get('/settings', controller.getSettings);
router.patch('/settings', controller.updateSettings);

// 2. Activity Log Endpoints (/api/admin/activity-logs)
router.get('/activity-logs', controller.getActivityLogs);
router.get('/activity-logs/:id', controller.getActivityLogById);

// 2.5 Loyalty Endpoints (/api/admin/loyalty)
router.get('/loyalty/pending', controller.getPendingLoyaltyDiscounts);
router.post('/loyalty/approve', controller.approveLoyaltyDiscount);

// 3. Mount all modular admin sub-routers
router.use('/categories', adminCategoryRouter);
router.use('/products', adminProductRouter);
router.use('/tags', adminTagRouter);
router.use('/orders', adminOrderRouter);
router.use('/payments', adminPaymentRouter);
router.use('/reviews', adminReviewRouter);
router.use('/custom-requests', adminCustomRequestRouter);
router.use('/quotations', adminQuotationRouter);
router.use('/inquiries', adminInquiryRouter);
router.use('/dashboard', adminDashboardRouter);
router.use('/events', adminEventRouter);
router.use('/monitoring', adminMonitoringRouter);

export default router;
