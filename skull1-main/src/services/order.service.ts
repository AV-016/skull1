import { OrderRepository } from '../repositories/order.repository';
import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { OrderResponseDTO, formatOrderResponse } from '../dto/order.dto';
import { AppError } from '../middlewares/error.middleware';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { sendOrderConfirmationEmail } from '../utils/mail';
import logger from '../utils/logger';

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
    // 1. Get cart items
    const cart = await cartRepository.findByUserId(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new AppError(400, 'Your cart is empty');
    }

    // 2. Validate stock and compute prices
    const items = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const product = await productRepository.findById(cartItem.productId);
      if (!product) {
        throw new AppError(404, `Product not found: ${cartItem.productId}`);
      }

      let itemPrice = product.price;
      if (cartItem.variantId) {
        const variant = product.variants?.find((v: any) => v.id === cartItem.variantId);
        if (!variant) {
          throw new AppError(404, `Variant not found: ${cartItem.variantId} for product ${product.name}`);
        }
        if (variant.stock < cartItem.quantity) {
          throw new AppError(400, `Insufficient stock for option ${variant.name} of product ${product.name}`);
        }
        if (variant.price !== null && variant.price !== undefined) {
          itemPrice = variant.price;
        }
      } else {
        if (product.stock < cartItem.quantity) {
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
    const user = await prisma.user.findUnique({
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
      const settings = await prisma.settings.findUnique({
        where: { id: 'global' },
        select: { codCharge: true }
      });
      codCharge = settings?.codCharge ?? 50.0;
      totalAmount += codCharge;
    }

    // 3. Create the order database entries (handles order placement, status history, cart cleanup in transaction)
    const order = await orderRepository.create({
      userId,
      addressId,
      totalAmount,
      items,
      paymentMethod,
      codCharge,
    });

    // 3.5 Reset user loyalty if discount was applied
    if (user && user.loyaltyDiscountSet && user.loyaltyDiscountValue > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          loyaltyStamps: 0,
          loyaltyDiscountPending: false,
          loyaltyDiscountValue: 0,
          loyaltyDiscountSet: false,
        },
      });
    }

    // 4. Update stock in database
    for (const item of items) {
      if (item.variantId) {
        const currentProduct = await productRepository.findById(item.productId);
        if (currentProduct) {
          const variant = currentProduct.variants?.find((v: any) => v.id === item.variantId);
          if (variant) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: variant.stock - item.quantity },
            });
          }
        }
      } else {
        const currentProduct = await productRepository.findById(item.productId);
        if (currentProduct) {
          await productRepository.update(item.productId, {
            stock: currentProduct.stock - item.quantity,
          });
        }
      }
    }

    // 5. Send order confirmation email for COD orders
    if (paymentMethod === 'COD' && user && user.email) {
      sendOrderConfirmationEmail(user.email, user.name || 'Customer', order.orderNumber, order.totalAmount)
        .catch((err) => logger.error(`Error sending COD order confirmation email to ${user.email}:`, err));
    }

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
          const varItem = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (varItem) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: varItem.stock + item.quantity },
            });
          }
        } else {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: prod.stock + item.quantity },
            });
          }
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

  async getOrderStatusHistory(userId: string, orderId: string, isAdmin: boolean = false): Promise<any> {
    const order = await this.getOrderById(userId, orderId, isAdmin);
    return order.statusHistory;
  }
}

export default OrderService;
