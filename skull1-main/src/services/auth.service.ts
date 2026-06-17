import { UserRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/hashPassword';
import { verifyPassword } from '../utils/verifyPassword';
import { generateToken } from '../utils/generateToken';
import { AppError } from '../middlewares/error.middleware';
import MESSAGES from '../constants/messages';
import { formatAuthResponse, AuthResponseDTO } from '../dto/auth.dto';
import { Role } from '@prisma/client';
import { authConfig } from '../config/auth';
import logger from '../utils/logger';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { sendOtpEmail, sendPasswordResetOtpEmail } from '../utils/mail';
import bcrypt from 'bcrypt';
import { getFirebaseAdmin } from '../config/firebase';
import { getAuth } from 'firebase-admin/auth';

const userRepository = new UserRepository();

export class AuthService {
  async register(data: any): Promise<AuthResponseDTO> {
    const email = String(data.email || '').trim().toLowerCase();
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError(400, MESSAGES.AUTH.USER_EXISTS);
    }

    const hashedPassword = await hashPassword(data.password);
    
    // Create user with isVerified: false
    const user = await userRepository.create({
      email,
      password: hashedPassword,
      name: data.name,
      role: Role.CUSTOMER,
      isVerified: false,
    });

    // Generate a 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any previous OTPs for this email
    await prisma.emailOTP.deleteMany({
      where: { email: user.email },
    });

    // Save OTP to DB
    await prisma.emailOTP.create({
      data: {
        email: user.email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      },
    });

    // Send OTP via Resend email utility
    await sendOtpEmail(user.email, user.name || 'User', otp);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return formatAuthResponse(user, token);
  }

  async login(data: any): Promise<AuthResponseDTO> {
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');

    console.log(`[LOGIN DEBUG] Request email: "${email}" (length: ${email.length}), password length: ${password.length}`);

    const user = await userRepository.findByEmail(email);
    if (!user) {
      console.log(`[LOGIN DEBUG] User not found for email: "${email}"`);
      throw new AppError(401, MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    console.log(`[LOGIN DEBUG] User found. Hash in DB: "${user.password}"`);

    const isPasswordValid = await verifyPassword(password, user.password);
    console.log(`[LOGIN DEBUG] Password validation result: ${isPasswordValid}`);

    if (!isPasswordValid) {
      throw new AppError(401, MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (!user.isVerified) {
      // Auto-send fresh verification OTP email when unverified user tries to log in
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.emailOTP.deleteMany({
        where: { email: user.email },
      });
      await prisma.emailOTP.create({
        data: {
          email: user.email,
          otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });
      await sendOtpEmail(user.email, user.name || 'User', otp);

      throw new AppError(403, 'Please verify your email address using the OTP sent to your email.');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return formatAuthResponse(user, token);
  }

  async verifyOtp(emailInput: string, otp: string): Promise<void> {
    const email = String(emailInput || '').trim().toLowerCase();
    if (!email || !otp) {
      throw new AppError(400, 'Email and OTP code are required.');
    }

    const record = await prisma.emailOTP.findFirst({
      where: { email, otp },
    });

    if (!record) {
      throw new AppError(400, 'Invalid OTP code.');
    }

    if (record.expiresAt < new Date()) {
      throw new AppError(400, 'OTP code has expired. Please request a new one.');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    await userRepository.update(user.id, {
      isVerified: true,
    });

    await prisma.emailOTP.delete({
      where: { id: record.id },
    });
  }

  async resendOtp(emailInput: string): Promise<void> {
    const email = String(emailInput || '').trim().toLowerCase();
    if (!email) {
      throw new AppError(400, 'Email is required.');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError(404, 'User not found with this email.');
    }

    if (user.isVerified) {
      throw new AppError(400, 'This email address is already verified.');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any old OTPs for this email
    await prisma.emailOTP.deleteMany({
      where: { email },
    });

    // Save new OTP
    await prisma.emailOTP.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send OTP via Resend
    await sendOtpEmail(email, user.name || 'User', otp);
  }

  // Keep verifyEmail legacy function for safety (no-op or simple fallback)
  async verifyEmail(token: string): Promise<void> {
    throw new AppError(400, 'This endpoint is deprecated. Please use the OTP verification flow.');
  }

  async forgotPassword(emailInput: string): Promise<void> {
    const email = String(emailInput || '').trim().toLowerCase();
    if (!email) {
      throw new AppError(400, 'Email address is required.');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Proactively succeed or fail silently to avoid email enumeration
      return;
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete old OTPs for this email
    await prisma.emailOTP.deleteMany({
      where: { email },
    });

    // Save OTP to DB
    await prisma.emailOTP.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send email
    await sendPasswordResetOtpEmail(email, user.name || 'User', otp);
  }

  async resetPassword(data: any): Promise<void> {
    const email = String(data.email || '').trim().toLowerCase();
    const otp = String(data.token || '').trim();
    const password = String(data.password || '');

    if (!email || !otp || !password) {
      throw new AppError(400, 'Email, OTP code, and new password are required.');
    }

    if (password.length < 6) {
      throw new AppError(400, 'Password must be at least 6 characters long.');
    }

    const record = await prisma.emailOTP.findFirst({
      where: { email, otp },
    });

    if (!record) {
      throw new AppError(400, 'Invalid OTP code.');
    }

    if (record.expiresAt < new Date()) {
      throw new AppError(400, 'OTP code has expired. Please request a new one.');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    const hashedPassword = await hashPassword(password);
    await userRepository.update(user.id, {
      password: hashedPassword,
    });

    // Delete OTP record after use
    await prisma.emailOTP.delete({
      where: { id: record.id },
    });
  }

  async handleGoogleCallback(code: string): Promise<AuthResponseDTO> {
    const { googleClientId, googleClientSecret, googleCallbackUrl } = authConfig;

    if (!googleClientId || !googleClientSecret) {
      throw new AppError(500, 'Google OAuth is not configured on the server.');
    }

    try {
      // 1. Exchange authorization code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: googleCallbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Failed to exchange code for tokens: ${errText}`);
      }

      const tokens = await tokenResponse.json() as { access_token: string };

      // 2. Fetch user profile from Google UserInfo endpoint
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google.');
      }

      const googleUser = await userInfoResponse.json() as { id: string; email: string; name?: string; picture?: string };

      // 3. Find or Create user in database
      let user = await userRepository.findByEmail(googleUser.email);

      if (user) {
        // Update googleId or picture if changed
        if (!user.googleId || user.picture !== googleUser.picture) {
          user = await userRepository.update(user.id, { 
            googleId: googleUser.id,
            picture: googleUser.picture || user.picture,
          });
        }
      } else {
        // Create new user (generate a random password since they use Google login)
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await hashPassword(randomPassword);

        user = await userRepository.create({
          email: googleUser.email,
          password: hashedPassword,
          name: googleUser.name || googleUser.email.split('@')[0],
          googleId: googleUser.id,
          picture: googleUser.picture || null,
          role: Role.CUSTOMER,
          isVerified: true, // Google accounts are pre-verified
        });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return formatAuthResponse(user, token);
    } catch (error: any) {
      logger.error('Error during Google OAuth process:', error);
      throw new AppError(400, `Google login failed: ${error.message}`);
    }
  }

  async getUserById(id: string): Promise<any> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError(404, MESSAGES.AUTH.USER_NOT_FOUND);
    }
    return user;
  }

  async sendPhoneOtp(userId: string, phoneInput: string): Promise<void> {
    throw new AppError(410, 'This endpoint is deprecated. Phone verification is now handled client-side.');
  }

  async verifyPhoneOtp(userId: string, token: string): Promise<void> {
    if (!token) {
      throw new AppError(400, 'Firebase verification token is required.');
    }

    let decodedToken;
    try {
      const firebaseAdmin = getFirebaseAdmin();
      decodedToken = await getAuth(firebaseAdmin).verifyIdToken(token);
    } catch (error: any) {
      logger.error('Error verifying Firebase ID token:', error);
      throw new AppError(401, `Invalid or expired Firebase verification token: ${error.message}`);
    }

    const phone = decodedToken.phone_number;
    if (!phone) {
      throw new AppError(400, 'Verification token does not contain a verified phone number.');
    }

    // Check if phone number is already verified by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phone,
        isPhoneVerified: true,
        NOT: { id: userId },
      },
    });
    if (existingUser) {
      throw new AppError(400, 'This phone number is already verified on another account.');
    }

    // Update user record
    await userRepository.update(userId, {
      phone,
      isPhoneVerified: true,
    });
  }

  async deleteAccount(userId: string): Promise<void> {
    await userRepository.delete(userId);
  }
}

export default AuthService;
