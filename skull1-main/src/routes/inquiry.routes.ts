import { Router } from 'express';
import { InquiryController } from '../controllers/inquiry.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';

const router = Router();
const controller = new InquiryController();

// 1. Public/Protected Inquiry Submission & Thread Routes (/api/inquiries)
router.post('/', controller.createInquiry);
router.get('/my', protect, controller.getMyInquiries);
router.get('/:id', protect, controller.getInquiryById);
router.post('/:id/messages', protect, controller.createInquiryMessage);

// 2. Admin Inquiry Moderation (Mounted at /api/admin/inquiries)
export const adminInquiryRouter = Router();
adminInquiryRouter.use(protect, restrictToAdmin);
adminInquiryRouter.get('/', controller.getAllInquiries);
adminInquiryRouter.get('/:id', controller.getInquiryById);
adminInquiryRouter.patch('/:id', controller.updateInquiry);
adminInquiryRouter.delete('/:id', controller.deleteInquiry);
adminInquiryRouter.post('/:id/messages', controller.createInquiryMessage);

export default router;

