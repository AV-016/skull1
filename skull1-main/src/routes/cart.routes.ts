import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();
const controller = new CartController();

router.use(protect); // All cart routes require authentication

router.get('/', controller.getCart);
router.post('/items', controller.addItem);
router.patch('/items/:itemId', controller.updateItem);
router.delete('/items/:itemId', controller.removeItem);
router.delete('/clear', controller.clearCart);

export default router;
