import { Request, Response, NextFunction } from 'express';
import { ShippingService } from '../services/shipping.service';

const shippingService = new ShippingService();

export class ShippingController {
  async calculateShipping(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerPincode, items } = req.body;
      const result = await shippingService.calculateShipping(customerPincode, items);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getRates(req: Request, res: Response, next: NextFunction) {
    try {
      const rates = await shippingService.getRates();
      res.status(200).json({
        success: true,
        data: rates
      });
    } catch (error) {
      next(error);
    }
  }

  async saveRate(req: Request, res: Response, next: NextFunction) {
    try {
      const rate = await shippingService.saveRate(req.body);
      res.status(200).json({
        success: true,
        data: rate
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRate(req: Request, res: Response, next: NextFunction) {
    try {
      await shippingService.deleteRate(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Shipping rate deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ShippingController;
