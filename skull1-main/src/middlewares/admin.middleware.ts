import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { Role } from '@prisma/client';
import MESSAGES from '../constants/messages';

export const restrictToAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== Role.ADMIN) {
    return next(new AppError(403, MESSAGES.AUTH.FORBIDDEN));
  }
  next();
};

export default restrictToAdmin;
