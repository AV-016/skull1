import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters long').max(100, 'Password cannot exceed 100 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters').optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
    password: z.string().min(1, 'Password is required').max(100, 'Password cannot exceed 100 characters'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
    token: z.string().min(1, 'Reset token is required').max(100, 'Token cannot exceed 100 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters long').max(100, 'Password cannot exceed 100 characters'),
  }),
});
