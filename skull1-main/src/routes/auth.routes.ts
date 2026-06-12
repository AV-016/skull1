import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();
const controller = new AuthController();

router.post('/register', validate(registerSchema), controller.register);
router.get('/verify-email', controller.verifyEmail);
router.post('/verify-otp', controller.verifyOtp);
router.post('/resend-otp', controller.resendOtp);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/logout', controller.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);

router.get('/me', protect, controller.me);
router.delete('/me', protect, controller.deleteAccount);
router.post('/send-phone-otp', protect, controller.sendPhoneOtp);
router.post('/verify-phone-otp', protect, controller.verifyPhoneOtp);
router.get('/google', controller.google);
router.get('/google/callback', controller.googleCallback);

export default router;
