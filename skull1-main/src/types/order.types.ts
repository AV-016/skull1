import { OrderStatus, PaymentStatus } from '@prisma/client';

export interface CreateOrderInput {
  addressId: string;
  cartItems: {
    productId: string;
    quantity: number;
    price: number;
  }[];
}

export interface OrderQueryFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: string;
  page?: number;
  limit?: number;
}
