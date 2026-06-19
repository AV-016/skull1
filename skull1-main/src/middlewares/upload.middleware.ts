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
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif', '.stl', '.obj', '.3mf', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  logger.info(`fileFilter called - originalname: ${file.originalname}, mimetype: ${file.mimetype}, ext: ${ext}`);
  
  if (!allowedExtensions.includes(ext)) {
    logger.error(`fileFilter rejected extension - originalname: ${file.originalname}, mimetype: ${file.mimetype}, ext: ${ext}`);
    return cb(new AppError(400, `Unsupported file type extension. Allowed formats: images (JPG, PNG, WEBP, GIF), STL, OBJ, 3MF, PDF`) as any, false);
  }

  // Double-validate image and PDF mimetypes to block disguised executables (e.g. shell.exe renamed to shell.png)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif'];
  if (imageExtensions.includes(ext) && !file.mimetype.startsWith('image/')) {
    logger.error(`fileFilter rejected mismatching image mimetype - originalname: ${file.originalname}, mimetype: ${file.mimetype}`);
    return cb(new AppError(400, `Mismatched file content. The file extension does not match its content type.`) as any, false);
  }

  if (ext === '.pdf' && file.mimetype !== 'application/pdf') {
    logger.error(`fileFilter rejected mismatching PDF mimetype - originalname: ${file.originalname}, mimetype: ${file.mimetype}`);
    return cb(new AppError(400, `Mismatched file content. The file extension does not match its content type.`) as any, false);
  }

  cb(null, true);
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limits
  },
});

export default upload;
