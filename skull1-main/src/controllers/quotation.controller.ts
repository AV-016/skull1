import { Request, Response, NextFunction } from 'express';
import { QuotationService } from '../services/quotation.service';
import MESSAGES from '../constants/messages';

const quotationService = new QuotationService();

export class QuotationController {
  async getQuotationById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const quotation = await quotationService.getQuotationById(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Quotation retrieved successfully',
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const quotation = await quotationService.acceptQuotation(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: MESSAGES.CUSTOM_REQUEST.QUOTATION_ACCEPTED,
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptQuotationAndCreateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const order = await quotationService.acceptQuotationAndCreateOrder(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Order created for quotation 20% advance',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const quotation = await quotationService.rejectQuotation(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: MESSAGES.CUSTOM_REQUEST.QUOTATION_REJECTED,
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }

  async createQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.createQuotation(req.body);
      res.status(201).json({
        success: true,
        message: MESSAGES.CUSTOM_REQUEST.QUOTATION_CREATED,
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.updateQuotation(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Quotation updated successfully',
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      await quotationService.deleteQuotation(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Quotation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default QuotationController;
