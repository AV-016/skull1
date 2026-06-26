import { Order, OrderItem, OrderStatusHistory, Address, Product, ProductImage, User } from '@prisma/client';

export interface OrderResponseDTO {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentId: string | null;
  createdAt: Date;
  paymentMethod: string;
  address: {
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string | null;
  };
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    specifications?: any;
    weightGrams?: number;
    dimensions?: string;
  }[];
  statusHistory: {
    id: string;
    status: string;
    notes: string | null;
    createdAt: Date;
  }[];
  trackingId?: string | null;
  carrier?: string | null;
  trackingUrl?: string | null;
  returnReason?: string | null;
  returnImage?: string | null;
  codCharge: number;
  shippingCharge: number;
  subtotal: number;
  gstAmount: number;
  platformFee: number;
  discountAmount: number;
  shippingZone?: string | null;
  shippingActualWeight?: number | null;
  shippingVolumetricWeight?: number | null;
  shippingWeightGrams?: number | null;
  shippingEstDays?: string | null;
  sellerPincode?: string | null;
  customerPincode?: string | null;
  shippingRateId?: string | null;
  shippingRuleVersion?: number;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export type OrderWithDetails = Order & {
  address: Address;
  items: (OrderItem & { product: Product & { images: ProductImage[] } })[];
  statusHistory: OrderStatusHistory[];
  user?: User | null;
};

export const formatOrderResponse = (order: OrderWithDetails): OrderResponseDTO => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentId: order.paymentId,
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod,
    trackingId: order.trackingId,
    carrier: order.carrier,
    trackingUrl: order.trackingUrl,
    returnReason: order.returnReason,
    returnImage: order.returnImage,
    codCharge: order.codCharge,
    shippingCharge: order.shippingCharge,
    subtotal: order.subtotal,
    gstAmount: order.gstAmount,
    platformFee: order.platformFee,
    discountAmount: order.discountAmount,
    shippingZone: order.shippingZone,
    shippingActualWeight: order.shippingActualWeight,
    shippingVolumetricWeight: order.shippingVolumetricWeight,
    shippingWeightGrams: order.shippingWeightGrams,
    shippingEstDays: order.shippingEstDays,
    sellerPincode: order.sellerPincode,
    customerPincode: order.customerPincode,
    shippingRateId: order.shippingRateId,
    shippingRuleVersion: order.shippingRuleVersion,
    address: {
      id: order.address.id,
      street: order.address.street,
      city: order.address.city,
      state: order.address.state,
      postalCode: order.address.postalCode,
      country: order.address.country,
      phone: (order.address as any).phone || null,
    },
    items: order.items.map((item) => {
      const primaryImage = item.product.images?.find((img) => img.isPrimary)?.url || item.product.images?.[0]?.url || '/placeholder.jpg';
      return {
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        image: primaryImage,
        specifications: item.product.specifications || null,
        weightGrams: item.product.weightGrams,
        dimensions: `${item.product.lengthCm || 0} x ${item.product.widthCm || 0} x ${item.product.heightCm || 0} cm`,
      };
    }),
    statusHistory: order.statusHistory.map((history) => ({
      id: history.id,
      status: history.status,
      notes: history.notes,
      createdAt: history.createdAt,
    })),
    user: order.user ? {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
    } : null,
  };
};
