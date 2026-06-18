import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import MESSAGES from '../constants/messages';
import { Role } from '@prisma/client';

const orderService = new OrderService();

export class OrderController {
  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const orderId = req.params.id;
      const isAdmin = req.user!.role === Role.ADMIN;
      const order = await orderService.getOrderById(userId, orderId, isAdmin);
      res.status(200).json({
        success: true,
        message: 'Order retrieved successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const orders = await orderService.getMyOrders(userId);
      res.status(200).json({
        success: true,
        message: 'My orders retrieved successfully',
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { addressId, paymentMethod } = req.body;
      const order = await orderService.createOrder(userId, addressId, paymentMethod);
      res.status(201).json({
        success: true,
        message: MESSAGES.ORDER.CREATED,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const orderId = req.params.id;
      const isAdmin = req.user!.role === Role.ADMIN;
      const order = await orderService.cancelOrder(userId, orderId, isAdmin);
      res.status(200).json({
        success: true,
        message: MESSAGES.ORDER.CANCELLED,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const orderId = req.params.id;
      const { reason, image } = req.body;
      const order = await orderService.requestReturn(userId, orderId, { reason, image });
      res.status(200).json({
        success: true,
        message: 'Return requested successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as any,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await orderService.getAllOrders(filters);
      res.status(200).json({
        success: true,
        message: 'All orders retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id;
      const { status, notes } = req.body;
      const order = await orderService.updateOrderStatus(orderId, status, notes);
      res.status(200).json({
        success: true,
        message: MESSAGES.ORDER.STATUS_UPDATED,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderShipping(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id;
      const { trackingId, carrier, trackingUrl } = req.body;
      const order = await orderService.updateOrderShipping(orderId, { trackingId, carrier, trackingUrl });
      res.status(200).json({
        success: true,
        message: 'Order shipping details updated successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const orderId = req.params.id;
      const isAdmin = req.user!.role === Role.ADMIN;
      const history = await orderService.getOrderStatusHistory(userId, orderId, isAdmin);
      res.status(200).json({
        success: true,
        message: 'Order status history retrieved',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default OrderController;
