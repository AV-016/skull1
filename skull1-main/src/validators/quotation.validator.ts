import { z } from 'zod';

export const createQuotationSchema = z.object({
  body: z.object({
    customRequestId: z.string().min(1, 'Custom request ID is required'),
    price: z.number().positive('Price must be greater than 0'),
    notes: z.string().optional(),
    validityDays: z.number().int().positive('Validity must be at least 1 day').default(7),
  }),
});

export const updateQuotationStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED'], {
      errorMap: () => ({ message: 'Status must be ACCEPTED or REJECTED' }),
    }),
  }),
});
