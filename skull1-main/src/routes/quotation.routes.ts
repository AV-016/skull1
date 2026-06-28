import { Router } from 'express';
import { QuotationController } from '../controllers/quotation.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createQuotationSchema } from '../validators/quotation.validator';

const router = Router();
const controller = new QuotationController();

// 1. Customer Quotation Controls (/api/quotations)
router.get('/:id', protect, controller.getQuotationById);
router.post('/:id/accept', protect, controller.acceptQuotation);
router.post('/:id/accept-and-pay', protect, controller.acceptQuotationAndCreateOrder);
router.post('/:id/reject', protect, controller.rejectQuotation);

// 2. Admin Quotation Controls (Mounted at /api/admin/quotations)
export const adminQuotationRouter = Router();
adminQuotationRouter.use(protect, restrictToAdmin);
adminQuotationRouter.post('/', validate(createQuotationSchema), controller.createQuotation);
adminQuotationRouter.patch('/:id', controller.updateQuotation);
adminQuotationRouter.delete('/:id', controller.deleteQuotation);

export default router;
