import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './error.middleware';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine path based on endpoint type
    if (req.originalUrl.includes('custom-requests')) {
      cb(null, path.join(__dirname, '../../uploads/custom-files'));
    } else {
      cb(null, path.join(__dirname, '../../uploads/temp'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

import logger from '../utils/logger';

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.jfif', '.stl', '.obj', '.3mf', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  logger.info(`fileFilter called - originalname: ${file.originalname}, mimetype: ${file.mimetype}, ext: ${ext}`);
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    logger.error(`fileFilter rejected - originalname: ${file.originalname}, mimetype: ${file.mimetype}, ext: ${ext}`);
    cb(new AppError(400, `Unsupported file type. Allowed formats: images, STL, OBJ, 3MF, PDF`) as any, false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limits
  },
});

export default upload;
