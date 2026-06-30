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
import { razorpay } from '../config/razorpay';
import { ShippingService } from './shipping.service';

const orderRepository = new OrderRepository();
const cartRepository = new CartRepository();
const productRepository = new ProductRepository();
const shippingService = new ShippingService();

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

  async createOrder(userId: string, addressId: string, paymentMethod: string = 'CARD', idempotencyKey?: string): Promise<any> {
    // Check idempotency key outside transaction first
    if (idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey },
      });
      if (existingOrder) {
        logger.info(`Duplicate order request with idempotency key found (pre-transaction). Returning existing Order ID: ${existingOrder.id}`);
        return existingOrder;
      }
    }

    // Retrieve shipping address and calculate dynamic shipping charge OUTSIDE database transaction
    // to avoid holding locks during slow external pincode network API calls
    const address = await prisma.address.findUnique({
      where: { id: addressId }
    });
    if (!address) {
      throw new AppError(404, 'Shipping address not found');
    }

    const preCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true }
    });
    if (!preCart || !preCart.items || preCart.items.length === 0) {
      throw new AppError(400, 'Your cart is empty');
    }

    const shippingItems = preCart.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));
    const shippingResult = await shippingService.calculateShipping(address.postalCode, shippingItems);
    const shippingCharge = shippingResult.shipping;

    try {
      // We execute all DB operations inside a single interactive transaction to prevent race conditions on stock
      const order = await prisma.$transaction(async (tx) => {
        // 0. Check idempotency key if provided
        if (idempotencyKey) {
          const existingOrder = await tx.order.findUnique({
            where: { idempotencyKey },
          });
          if (existingOrder) {
            logger.info(`Duplicate order request with idempotency key found. Returning existing Order ID: ${existingOrder.id}`);
            return existingOrder;
          }
        }

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

        // Fetch dynamic settings (GST, Platform Fees, Volumetric divisor, etc.)
        const settings = await tx.settings.findUnique({
          where: { id: 'global' }
        });

        // 2.5 Fetch and apply loyalty discount if any
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { loyaltyDiscountSet: true, loyaltyDiscountValue: true, email: true, name: true },
        });

        const orderSubtotal = totalAmount; // original items subtotal
        let discountAmount = 0;
        if (user && user.loyaltyDiscountSet && user.loyaltyDiscountValue > 0) {
          discountAmount = orderSubtotal * (user.loyaltyDiscountValue / 100);
        }
        const discountedSubtotal = Math.max(0, orderSubtotal - discountAmount);

        // Dynamic settings-driven GST calculation
        const isGstEnabled = settings?.isGstEnabled ?? true;
        const gstRate = settings?.defaultGstRate ?? 18.0;
        const gstAmount = isGstEnabled ? (discountedSubtotal * (gstRate / 100)) : 0.0;

        // Dynamic settings-driven Platform Fee calculation
        let platformFee = 0.0;
        if (settings) {
          const feeVal = settings.platformFeeValue || 0.0;
          if (settings.platformFeeType === 'PERCENTAGE') {
            platformFee = discountedSubtotal * (feeVal / 100);
          } else {
            platformFee = feeVal;
          }
        }



        // 2.7 COD handling charge is disabled since shipping charges are active
        const codCharge = 0.0;

        const finalTotalAmount = discountedSubtotal + gstAmount + platformFee + shippingCharge;

        // 3. Create order database entries
        const orderNumber = generateOrderNumber();

        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            userId,
            addressId,
            subtotal: orderSubtotal,
            discountAmount,
            gstAmount,
            platformFee,
            shippingCharge,
            codCharge,
            totalAmount: finalTotalAmount,
            shippingZone: shippingResult.zone,
            shippingActualWeight: shippingResult.actualWeightGrams,
            shippingVolumetricWeight: shippingResult.volumetricWeightGrams,
            shippingWeightGrams: shippingResult.totalWeightGrams,
            shippingEstDays: shippingResult.estimatedDelivery,
            sellerPincode: shippingResult.sellerPincode,
            customerPincode: shippingResult.customerPincode,
            shippingRateId: shippingResult.shippingRateId,
            shippingRuleVersion: 1, // Default initial rule version
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod,
            idempotencyKey: idempotencyKey || null,
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

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'ORDER_CREATE',
          details: `Placed Order #${order.orderNumber} via ${paymentMethod} for total amount of ₹${order.totalAmount}`,
        },
      }).catch((err) => logger.error('Error logging ORDER_CREATE activity:', err));

      return order;
    } catch (error: any) {
      if (idempotencyKey) {
        const existingOrder = await prisma.order.findUnique({
          where: { idempotencyKey }
        });
        if (existingOrder) {
          logger.warn(`Error "${error.message}" bypassed during duplicate order placement. Returning existing order for key: ${idempotencyKey}`);
          return existingOrder;
        }
      }
      throw error;
    }
  }

  async cancelOrder(userId: string, orderId: string, isAdmin: boolean = false): Promise<OrderResponseDTO> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new AppError(403, 'Forbidden access to this order');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PROCESSING) {
      throw new AppError(400, 'Cannot cancel order that is already shipped');
    }

    // If the payment status is PAID and payment method was CARD, trigger Razorpay refund (bypass for custom orders)
    let targetPaymentStatus = order.paymentStatus;
    const isCustomOrder = order.orderNumber.startsWith('CR-');
    if (order.paymentStatus === PaymentStatus.PAID && order.paymentMethod === 'CARD' && order.paymentId && !isCustomOrder) {
      try {
        await razorpay.payments.refund(order.paymentId, {
          amount: Math.round(order.totalAmount * 100),
          notes: {
            reason: 'Order cancelled by customer'
          }
        });
        targetPaymentStatus = PaymentStatus.REFUNDED;
      } catch (rzpErr: any) {
        logger.error(`Failed to trigger refund on Razorpay for cancelled payment ${order.paymentId}:`, rzpErr);
        throw new AppError(400, `Failed to refund on Razorpay: ${rzpErr.description || rzpErr.message || 'Unknown error'}`);
      }
    }

    // Transaction to update order status, status history, and restock items
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: orderId },
        data: { 
          status: OrderStatus.CANCELLED,
          paymentStatus: targetPaymentStatus
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          notes: isCustomOrder 
            ? 'Cancelled by customer. Custom order advance payment is non-refundable.'
            : (order.paymentStatus === PaymentStatus.PAID && order.paymentMethod === 'CARD'
                ? 'Cancelled by customer. Refund processed successfully via Razorpay.'
                : 'Cancelled by customer.'),
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

    let targetPaymentStatus = order.paymentStatus;
    if (status === OrderStatus.RETURNED && order.paymentStatus === PaymentStatus.PAID) {
      if (order.paymentMethod === 'CARD') {
        try {
          const dbPayments = await prisma.payment.findMany({
            where: { orderId: order.id, status: 'success' }
          });
          if (dbPayments.length > 0) {
            for (const payment of dbPayments) {
              if (payment.razorpayPaymentId) {
                await razorpay.payments.refund(payment.razorpayPaymentId, {
                  amount: Math.round(payment.amount * 100),
                  notes: { reason: 'Order returned by customer' }
                });
              }
            }
          } else if (order.paymentId) {
            await razorpay.payments.refund(order.paymentId, {
              amount: Math.round(order.totalAmount * 100),
              notes: { reason: 'Order returned by customer' }
            });
          }
          targetPaymentStatus = PaymentStatus.REFUNDED;
        } catch (rzpErr: any) {
          logger.error(`Failed to trigger refund on Razorpay for returned order ${order.orderNumber}:`, rzpErr);
          throw new AppError(400, `Failed to refund on Razorpay: ${rzpErr.description || rzpErr.message || 'Unknown Razorpay error'}`);
        }
      } else if (order.paymentMethod === 'COD') {
        targetPaymentStatus = PaymentStatus.REFUNDED;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          paymentStatus: targetPaymentStatus,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          notes: notes || (status === OrderStatus.RETURNED 
            ? (order.paymentMethod === 'COD' 
              ? `Return completed. COD refund to UPI: ${order.returnUpiId || 'N/A'} marked as completed.` 
              : 'Return completed. Refund processed automatically via Razorpay.') 
            : `Order status updated to ${status}`),
        },
      });
    });

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

  async requestReturn(userId: string, orderId: string, data: { reason: string; image: string; upiId?: string }): Promise<OrderResponseDTO> {
    const { reason, image, upiId } = data;
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

    if (order.paymentMethod === 'COD' && (!upiId || upiId.trim() === '')) {
      throw new AppError(400, 'UPI ID is required for Cash on Delivery refunds');
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

    await orderRepository.saveReturnRequest(orderId, reason, image, upiId);
    const refreshed = await orderRepository.findById(orderId);
    return formatOrderResponse(refreshed!);
  }

  async getOrderStatusHistory(userId: string, orderId: string, isAdmin: boolean = false): Promise<any> {
    const order = await this.getOrderById(userId, orderId, isAdmin);
    return order.statusHistory;
  }

  async markOrderPaid(orderId: string): Promise<OrderResponseDTO> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new AppError(400, 'Order is already marked as paid');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.CONFIRMED
        },
        include: { user: true }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CONFIRMED,
          notes: 'Payment manually verified & order confirmed by Administrator.'
        }
      });

      return ord;
    });

    if (updated.user?.email) {
      sendOrderConfirmationEmail(
        updated.user.email,
        updated.user.name || 'Customer',
        updated.orderNumber,
        updated.totalAmount
      ).catch((err) => logger.error(`Error sending email in manual mark-paid:`, err));
    }

    const refreshed = await orderRepository.findById(orderId);
    return formatOrderResponse(refreshed!);
  }

  async refundOrder(orderId: string): Promise<OrderResponseDTO> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }
    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      throw new AppError(400, 'Order is already refunded');
    }

    if (order.paymentMethod === 'CARD') {
      try {
        // Find all successful payments in database
        const dbPayments = await prisma.payment.findMany({
          where: { orderId: order.id, status: 'success' }
        });

        if (dbPayments.length > 0) {
          // Refund each transaction individually
          for (const payment of dbPayments) {
            if (payment.razorpayPaymentId) {
              await razorpay.payments.refund(payment.razorpayPaymentId, {
                amount: Math.round(payment.amount * 100),
                notes: {
                  reason: 'Order refunded by Admin'
                }
              });
            }
          }
        } else if (order.paymentId) {
          // Fallback for legacy orders (only 20% advance was captured for custom orders)
          const isCustom = order.orderNumber.startsWith('CR-');
          const refundAmt = isCustom ? Math.round(order.totalAmount * 0.20) : order.totalAmount;

          await razorpay.payments.refund(order.paymentId, {
            amount: Math.round(refundAmt * 100),
            notes: {
              reason: 'Order refunded by Admin'
            }
          });
        }
      } catch (rzpErr: any) {
        logger.error(`Failed to trigger refund on Razorpay for order ${order.orderNumber}:`, rzpErr);
        throw new AppError(400, `Failed to refund on Razorpay: ${rzpErr.description || rzpErr.message || 'Unknown Razorpay error'}`);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: OrderStatus.CANCELLED
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          notes: 'Order cancelled and refund processed manually by Administrator.'
        }
      });

      // Restock items
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } }
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      return ord;
    });

    const refreshed = await orderRepository.findById(orderId);
    return formatOrderResponse(refreshed!);
  }

  async submitReturnTracking(
    userId: string,
    orderId: string,
    data: { carrier: string; trackingId: string; trackingUrl?: string }
  ): Promise<OrderResponseDTO> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.userId !== userId) {
      throw new AppError(403, 'Forbidden access to this order');
    }

    if (order.status !== OrderStatus.RETURN_APPROVED) {
      throw new AppError(400, 'Tracking details can only be submitted for approved returns');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        returnCarrier: data.carrier,
        returnTrackingId: data.trackingId,
        returnTrackingUrl: data.trackingUrl || null,
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: OrderStatus.RETURN_APPROVED,
        notes: `Customer provided return shipping details: ${data.carrier} - ${data.trackingId}`,
      },
    });

    const refreshed = await orderRepository.findById(orderId);
    return formatOrderResponse(refreshed!);
  }
}

export default OrderService;
