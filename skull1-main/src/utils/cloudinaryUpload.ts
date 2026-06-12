import { cloudinary } from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';
import logger from './logger';

export const uploadToCloudinary = async (
  filePath: string,
  folder: string
): Promise<UploadApiResponse> => {
  try {
    const response = await cloudinary.uploader.upload(filePath, {
      folder: `skulture/${folder}`,
      resource_type: 'auto',
    });
    return response;
  } catch (error) {
    logger.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};
