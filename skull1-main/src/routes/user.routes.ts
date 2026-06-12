import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
const controller = new UserController();

router.use(protect); // All user routes require authentication

router.get('/profile', controller.getProfile);
router.patch('/profile', controller.updateProfile);
router.delete('/profile', controller.deleteProfile);

router.get('/dashboard', controller.getDashboard);
router.get('/activity', controller.getActivity);

export default router;
