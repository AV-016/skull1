import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import { AppError } from '../middlewares/error.middleware';

const uploadService = new UploadService();

export class UploadController {
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded');
      }
      const folder = req.query.folder ? String(req.query.folder) : 'general';
      const url = await uploadService.uploadFile(req.file.path, folder);

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadProductImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'No product image file uploaded');
      }
      const url = await uploadService.uploadFile(req.file.path, 'products');

      res.status(200).json({
        success: true,
        message: 'Product image uploaded successfully',
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadReviewImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'No review image file uploaded');
      }
      const url = await uploadService.uploadFile(req.file.path, 'reviews');

      res.status(200).json({
        success: true,
        message: 'Review image uploaded successfully',
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadCustomFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded for custom request');
      }
      const url = await uploadService.uploadFile(req.file.path, 'custom-requests');

      res.status(200).json({
        success: true,
        message: 'Custom file uploaded successfully',
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UploadController;
