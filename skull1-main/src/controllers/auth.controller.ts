import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import MESSAGES from '../constants/messages';
import { authConfig } from '../config/auth';
import { AppError } from '../middlewares/error.middleware';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: MESSAGES.AUTH.REGISTER_SUCCESS,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query;
      await authService.verifyEmail(String(token));
      res.status(200).json({
        success: true,
        message: 'Email verified successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      await authService.verifyOtp(email, otp);
      res.status(200).json({
        success: true,
        message: 'Email verified successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authService.resendOtp(email);
      res.status(200).json({
        success: true,
        message: 'A new verification code has been sent to your email.',
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        success: true,
        message: MESSAGES.AUTH.LOGIN_SUCCESS,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        message: MESSAGES.AUTH.LOGOUT_SUCCESS,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      res.status(200).json({
        success: true,
        message: MESSAGES.AUTH.PASSWORD_RESET_SENT,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body);
      res.status(200).json({
        success: true,
        message: MESSAGES.AUTH.PASSWORD_RESET_SUCCESS,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await authService.getUserById(userId);
      res.status(200).json({
        success: true,
        message: 'Current user profile retrieved',
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          picture: user.picture,
          phone: user.phone,
          isPhoneVerified: user.isPhoneVerified,
          loyaltyStamps: user.loyaltyStamps,
          loyaltyDiscountPending: user.loyaltyDiscountPending,
          loyaltyDiscountValue: user.loyaltyDiscountValue,
          loyaltyDiscountSet: user.loyaltyDiscountSet,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async google(req: Request, res: Response, next: NextFunction) {
    try {
      const { googleClientId, googleCallbackUrl } = authConfig;
      if (!googleClientId) {
        throw new AppError(500, 'Google OAuth is not configured on this server.');
      }
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(googleCallbackUrl)}&response_type=code&scope=email%20profile`;
      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;
      if (!code) {
        throw new AppError(400, 'Google Authorization Code was not provided.');
      }

      const result = await authService.handleGoogleCallback(String(code));

      const { frontendUrl } = authConfig;
      res.redirect(`${frontendUrl}/auth-callback?token=${result.token}`);
    } catch (error) {
      next(error);
    }
  }

  async sendPhoneOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { phone } = req.body;
      await authService.sendPhoneOtp(userId, phone);
      res.status(200).json({
        success: true,
        message: 'Verification OTP has been sent via SMS.',
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyPhoneOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { token } = req.body;
      await authService.verifyPhoneOtp(userId, token);
      res.status(200).json({
        success: true,
        message: 'Phone number verified successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      await authService.deleteAccount(userId);
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
