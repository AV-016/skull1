import { z } from 'zod';

export const createAddressSchema = z.object({
  body: z.object({
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().min(2, 'State must be at least 2 characters'),
    postalCode: z.string().min(4, 'Postal code must be at least 4 characters'),
    country: z.string().min(2, 'Country must be at least 2 characters'),
    phone: z.string().regex(/^\+91\d{10}$/, 'Phone number must be exactly 10 digits (excluding +91)').optional().or(z.literal('')),
    isDefault: z.boolean().optional(),
  }),
});

export const updateAddressSchema = z.object({
  body: z.object({
    street: z.string().min(5).optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    postalCode: z.string().min(4).optional(),
    country: z.string().min(2).optional(),
    phone: z.string().regex(/^\+91\d{10}$/, 'Phone number must be exactly 10 digits (excluding +91)').optional().or(z.literal('')),
    isDefault: z.boolean().optional(),
  }),
});
