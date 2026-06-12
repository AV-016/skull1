import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';

const router = Router();
const controller = new DashboardController();

// 1. Customer Dashboard Stats (/api/dashboard/customer)
router.get('/customer', protect, controller.getCustomerDashboard);

// 2. Admin Dashboard Stats (Mounted at /api/admin/dashboard)
export const adminDashboardRouter = Router();
adminDashboardRouter.use(protect, restrictToAdmin);
adminDashboardRouter.get('/', controller.getAdminDashboard);

export default router;
