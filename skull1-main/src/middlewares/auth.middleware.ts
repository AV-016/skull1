import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { AppError } from './error.middleware';
import { JWTPayload } from '../types/auth.types';
import MESSAGES from '../constants/messages';
import { prisma } from '../config/database';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
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

    // Fetch user tokenVersion from DB to allow remote session invalidation
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, tokenVersion: true },
    });

    if (!user) {
      return next(new AppError(401, 'User account no longer exists.'));
    }

    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      return next(new AppError(401, 'Your session has expired (password was reset). Please log in again.'));
    }

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
