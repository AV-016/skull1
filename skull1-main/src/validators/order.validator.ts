import { z } from 'zod';
import { ORDER_STATUS } from '../constants/orderStatus';

export const createOrderSchema = z.object({
  body: z.object({
    addressId: z.string().min(1, 'Delivery address is required'),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ORDER_STATUS, {
      errorMap: () => ({ message: 'Invalid order status' }),
    }),
    notes: z.string().optional(),
  }),
});

export const updateOrderShippingSchema = z.object({
  body: z.object({
    trackingId: z.string().nullable().optional(),
    carrier: z.string().nullable().optional(),
    trackingUrl: z.string().nullable().optional(),
  }),
});
