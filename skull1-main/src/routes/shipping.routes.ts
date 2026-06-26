import { Router } from 'express';
import { ShippingController } from '../controllers/shipping.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';

const router = Router();
const controller = new ShippingController();

// Customer/Public Route to calculate shipping
router.post('/calculate', controller.calculateShipping);

// Admin Routes for managing shipping rates
router.get('/rates', protect, restrictToAdmin, controller.getRates);
router.post('/rates', protect, restrictToAdmin, controller.saveRate);
router.delete('/rates/:id', protect, restrictToAdmin, controller.deleteRate);

export default router;
