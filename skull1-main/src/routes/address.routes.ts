import { Router } from 'express';
import { AddressController } from '../controllers/address.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAddressSchema, updateAddressSchema } from '../validators/address.validator';

const router = Router();
const controller = new AddressController();

router.use(protect); // All address routes require authentication

router.get('/', controller.getAddresses);
router.post('/', validate(createAddressSchema), controller.createAddress);

router.get('/:id', controller.getAddressById);
router.patch('/:id', validate(updateAddressSchema), controller.updateAddress);
router.delete('/:id', controller.deleteAddress);

router.patch('/:id/default', controller.setDefault);

export default router;
