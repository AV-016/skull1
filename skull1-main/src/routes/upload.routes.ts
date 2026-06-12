import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { protect } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();
const controller = new UploadController();

router.use(protect); // All uploads require authentication

router.post('/image', upload.single('file'), controller.uploadImage);
router.post('/product-image', upload.single('file'), controller.uploadProductImage);
router.post('/review-image', upload.single('file'), controller.uploadReviewImage);
router.post('/custom-file', upload.single('file'), controller.uploadCustomFile);

export default router;
