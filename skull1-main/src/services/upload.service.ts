import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { AppError } from '../middlewares/error.middleware';
import fs from 'fs';
import logger from '../utils/logger';

export class UploadService {
  async uploadFile(localPath: string, folder: string): Promise<string> {
    try {
      const result = await uploadToCloudinary(localPath, folder);
      
      // Delete local file after successful upload to Cloudinary
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }

      return result.secure_url;
    } catch (error) {
      // Cleanup local file in case of error
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      logger.error('UploadService error:', error);
      throw new AppError(500, 'Cloudinary upload failed');
    }
  }
}

export default UploadService;
