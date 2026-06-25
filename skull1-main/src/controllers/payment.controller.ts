import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import MESSAGES from '../constants/messages';

const paymentService = new PaymentService();

export class PaymentController {
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
