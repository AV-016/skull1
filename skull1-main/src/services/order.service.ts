import { OrderRepository } from '../repositories/order.repository';
import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { OrderResponseDTO, formatOrderResponse } from '../dto/order.dto';
import { AppError } from '../middlewares/error.middleware';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { sendOrderConfirmationEmail } from '../utils/mail';
import logger from '../utils/logger';
import { generateOrderNumber } from '../utils/generateOrderNumber';

const orderRepository = new OrderRepository();
const cartRepository = new CartRepository();
const productRepository = new ProductRepository();

export class OrderService {
  async getOrderById(userId: string, orderId: string, isAdmin: boolean = false): Promise<OrderResponseDTO> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Security check: must be owner of order OR admin
    if (!isAdmin && order.userId !== userId) {
      throw new AppError(403, 'Forbidden access to this order');
    }

    return formatOrderResponse(order);
  }

  async getMyOrders(userId: string): Promise<OrderResponseDTO[]> {
    const orders = await orderRepository.findByUserId(userId);
    return orders.map(formatOrderResponse);
  }

  async getAllOrders(filters: { status?: OrderStatus; page?: number; limit?: number }): Promise<any> {
    const { orders, total } = await orderRepository.findAll(filters);
    const limit = filters.limit ? Number(filters.limit) : 10;
    const page = filters.page ? Number(filters.page) : 1;

    return {
      data: orders.map(formatOrderResponse),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createOrder(userId: string, addressId: string, paymentMethod: string = 'CARD'): Promise<any> {
    // We execute all DB operations inside a single interactive transaction to prevent race conditions on stock
    const order = await prisma.$transaction(async (tx) => {
      // 1. Get cart items inside transaction
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new AppError(400, 'Your cart is empty');
      }

      // 2. Validate stock and compute prices
      const items = [];
      let totalAmount = 0;

      for (const cartItem of cart.items) {
        const product = cartItem.product;
        if (!product) {
          throw new AppError(404, `Product not found for cart item: ${cartItem.productId}`);
        }
        if (!product.isActive) {
          throw new AppError(400, `Product is no longer active: ${product.name}`);
        }

        let itemPrice = product.price;

        if (cartItem.variantId) {
          const variant = cartItem.variant;
          if (!variant || variant.productId !== product.id) {
            throw new AppError(404, `Variant not found: ${cartItem.variantId} for product ${product.name}`);
          }
          if (variant.price !== null && variant.price !== undefined) {
            itemPrice = variant.price;
          }

          // Atomically decrement variant stock and verify stock >= quantity
          const updatedVariant = await tx.productVariant.updateMany({
            where: {
              id: cartItem.variantId,
              stock: { gte: cartItem.quantity },
            },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
            },
          });

          if (updatedVariant.count === 0) {
            throw new AppError(400, `Insufficient stock for option ${variant.name} of product ${product.name}`);
          }
        } else {
          // Atomically decrement product stock and verify stock >= quantity
          const updatedProduct = await tx.product.updateMany({
            where: {
              id: cartItem.productId,
              stock: { gte: cartItem.quantity },
            },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
            },
          });

          if (updatedProduct.count === 0) {
            throw new AppError(400, `Insufficient stock for product: ${product.name}`);
          }
        }

        const itemTotal = itemPrice * cartItem.quantity;
        totalAmount += itemTotal;

        items.push({
          productId: product.id,
          variantId: cartItem.variantId || null,
          quantity: cartItem.quantity,
          price: itemPrice,
        });
      }

      // 2.5 Fetch and apply loyalty discount if any
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { loyaltyDiscountSet: true, loyaltyDiscountValue: true, email: true, name: true },
      });

      let discountApplied = 0;
      if (user && user.loyaltyDiscountSet && user.loyaltyDiscountValue > 0) {
        discountApplied = totalAmount * (user.loyaltyDiscountValue / 100);
        totalAmount = Math.max(0, totalAmount - discountApplied);
      }

      // 2.7 Fetch and apply COD charge if payment method is COD
      let codCharge = 0;
      if (paymentMethod === 'COD') {
        const settings = await tx.settings.findUnique({
          where: { id: 'global' },
          select: { codCharge: true }
        });
        codCharge = settings?.codCharge ?? 50.0;
        totalAmount += codCharge;
      }

      // 3. Create order database entries
      const orderNumber = generateOrderNumber();

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          totalAmount,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod,
          codCharge,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              notes: paymentMethod === 'COD' ? 'Order placed via Cash on Delivery.' : 'Order placed, pending payment.',
            },
          },
        },
      });

      // 3.5 Reset user loyalty if discount was applied
      if (user && user.loyaltyDiscountSet && user.loyaltyDiscountValue > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyStamps: 0,
            loyaltyDiscountPending: false,
            loyaltyDiscountValue: 0,
            loyaltyDiscountSet: false,
          },
        });
      }

      // 4. Clear user's cart
      await tx.cart.update({
        where: { userId },
        data: {
          items: {
            deleteMany: {},
          },
        },
      });

      return createdOrder;
    }, {
      timeout: 20000 // 20 seconds timeout for interactive transaction
    });

    // 5. Asynchronously send email confirmation for COD orders
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (paymentMethod === 'COD' && user && user.email) {
      sendOrderConfirmationEmail(user.email, user.name || 'Customer', order.orderNumber, order.totalAmount)
        .catch((err) => logger.error(`Error sending COD order confirmation email to ${user.email}:`, err));
    }

    logger.info(`Order placed successfully: Order #${order.orderNumber} (ID: ${order.id}) by User (ID: ${userId}), Total: ₹${order.totalAmount}, Method: ${paymentMethod}`);

    return order;
  }

  async cancelOrder(userId: string, orderId: string, isAdmin: boolean = false): Promise<OrderResponseDTO> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new AppError(403, 'Forbidden access to this order');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new AppError(400, 'Cannot cancel order that is already being processed or shipped');
    }

    // Transaction to update order status, status history, and restock items
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          notes: 'Cancelled by customer.',
        },
      });

      // Restock items
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return ord;
    });

    const refreshed = await orderRepository.findById(orderId);
    return formatOrderResponse(refreshed!);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<OrderResponseDTO> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    await orderRepository.updateStatus(orderId, status, notes);
    const refreshed = await orderRepository.findById(orderId);
    return formatOrderResponse(refreshed!);
  }

  async updateOrderShipping(
    orderId: string,
    data: { trackingId: string | null; carrier: string | null; trackingUrl: string | null }
  ): Promise<OrderResponseDTO> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    await orderRepository.updateShippingDetails(orderId, data);
    const refreshed = await orderRepository.findById(orderId);
    return formatOrderResponse(refreshed!);
  }

  async requestReturn(userId: string, orderId: string, data: { reason: string; image: string }): Promise<OrderResponseDTO> {
    const { reason, image } = data;
    if (!reason || reason.trim() === '') {
      throw new AppError(400, 'Return reason is required');
    }
    if (!image || image.trim() === '') {
      throw new AppError(400, 'Return proof image is required');
    }

    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.userId !== userId) {
      throw new AppError(403, 'Forbidden access to this order');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new AppError(400, 'Only delivered orders can be returned');
    }

    // Check 3 days window
    const deliveredHistory = order.statusHistory.find((h) => h.status === OrderStatus.DELIVERED);
    if (deliveredHistory) {
      const deliveryTime = new Date(deliveredHistory.createdAt).getTime();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - deliveryTime > threeDaysInMs) {
        throw new AppError(400, 'Return window (3 days after delivery) has expired');
      }
    }

    await orderRepository.saveReturnRequest(orderId, reason, image);
    const refreshed = await orderRepository.findById(orderId);
    return formatOrderResponse(refreshed!);
  }

  async getOrderStatusHistory(userId: string, orderId: string, isAdmin: boolean = false): Promise<any> {
    const order = await this.getOrderById(userId, orderId, isAdmin);
    return order.statusHistory;
  }
}

export default OrderService;
