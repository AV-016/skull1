import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { AppError } from './error.middleware';
import { JWTPayload } from '../types/auth.types';
import MESSAGES from '../constants/messages';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError(401, MESSAGES.AUTH.UNAUTHORIZED));
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as JWTPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return next(new AppError(401, MESSAGES.AUTH.TOKEN_EXPIRED));
  }
};

export default protect;
