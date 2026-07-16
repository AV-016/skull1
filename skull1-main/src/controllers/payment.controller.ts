// PaymentController: Orchestrates incoming Express requests, calling PaymentService for payment business logic.
import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import MESSAGES from '../constants/messages';

const paymentService = new PaymentService();

export class PaymentController {
  // POST /api/payments/create-order: Creates a transaction/session order on Razorpay for a given order ID.
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { orderId } = req.body;
      const rzpOrder = await paymentService.createRazorpayOrder(userId, orderId);
      res.status(200).json({
        success: true,
        message: MESSAGES.PAYMENT.ORDER_CREATED,
        data: rzpOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/payments/verify: Verifies the authenticity of Razorpay signature response submitted by frontend.
  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      await paymentService.verifyPayment(
        userId,
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );
      res.status(200).json({
        success: true,
        message: MESSAGES.PAYMENT.VERIFIED,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/payments/webhook: Public endpoint to handle event status updates sent directly from Razorpay (e.g. captured or failed payments).
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = req.rawBody || JSON.stringify(req.body);
      await paymentService.handleWebhook(rawBody, signature);
      res.status(200).json({
        success: true,
        message: MESSAGES.PAYMENT.WEBHOOK_RECEIVED,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/payments: Retrieves a paginated list of all payment logs (Admin only).
  async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await paymentService.getPayments(page, limit);
      res.status(200).json({
        success: true,
        message: 'Payments list retrieved successfully',
        data: result.payments,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/payments/:id: Retrieves a single payment record by database ID (Admin only).
  async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Payment log retrieved',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default PaymentController;
