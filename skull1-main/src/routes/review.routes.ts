import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createReviewSchema, updateReviewSchema } from '../validators/review.validator';

const router = Router();
const controller = new ReviewController();

// 1. Product specific reviews (/api/products/:productId/reviews)
// GET is public, POST requires auth
router.get('/products/:productId/reviews', controller.getProductReviews);
router.post('/products/:productId/reviews', protect, validate(createReviewSchema), controller.createReview);

// 2. Individual review controls (/api/reviews)
router.get('/reviews', controller.getAllReviews);
router.patch('/reviews/:id', protect, validate(updateReviewSchema), controller.updateReview);
router.delete('/reviews/:id', protect, controller.deleteReview);

// 3. Review Image Routes (/api/reviews)
router.post('/reviews/:id/images', protect, controller.addImage);
router.delete('/reviews/images/:imageId', protect, controller.deleteImage);

// 4. Admin Review Controls (Mounted at /api/admin/reviews)
export const adminReviewRouter = Router();
adminReviewRouter.use(protect, restrictToAdmin);
adminReviewRouter.get('/', controller.getAllReviews);
adminReviewRouter.patch('/:id/hide', controller.hideReview);
adminReviewRouter.patch('/:id/show', controller.showReview);

export default router;
