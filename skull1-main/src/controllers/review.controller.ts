import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import MESSAGES from '../constants/messages';
import { Role } from '@prisma/client';

const reviewService = new ReviewService();

export class ReviewController {
  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.getProductReviews(req.params.productId);
      res.status(200).json({
        success: true,
        message: 'Product reviews retrieved successfully',
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  }

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const productId = req.params.productId;
      const review = await reviewService.createReview(userId, productId, req.body);
      res.status(201).json({
        success: true,
        message: MESSAGES.REVIEW.CREATED,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const reviewId = req.params.id;
      const review = await reviewService.updateReview(userId, reviewId, req.body);
      res.status(200).json({
        success: true,
        message: MESSAGES.REVIEW.UPDATED,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const reviewId = req.params.id;
      const isAdmin = req.user!.role === Role.ADMIN;
      await reviewService.deleteReview(userId, reviewId, isAdmin);
      res.status(200).json({
        success: true,
        message: MESSAGES.REVIEW.DELETED,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await reviewService.getAllReviews(page, limit);
      res.status(200).json({
        success: true,
        message: 'All reviews retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async hideReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.hideReview(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Review hidden successfully',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async showReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.showReview(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Review displayed successfully',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  // Review Images placeholders
  async addImage(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json({
        success: true,
        message: 'Review image added placeholder',
        data: { url: req.body.url },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        message: 'Review image deleted placeholder',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ReviewController;
