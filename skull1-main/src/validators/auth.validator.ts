import { z } from 'zod';

const passwordValidation = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password cannot exceed 100 characters')
  .refine(
    (val) => /[A-Z]/.test(val),
    { message: 'Password must contain at least one uppercase letter (A-Z)' }
  )
  .refine(
    (val) => /[0-9]/.test(val),
    { message: 'Password must contain at least one number (0-9)' }
  )
  .refine(
    (val) => /[^A-Za-z0-9]/.test(val),
    { message: 'Password must contain at least one special character/symbol' }
  );

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
    password: passwordValidation,
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
    password: passwordValidation,
  }),
});
