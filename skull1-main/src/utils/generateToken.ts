import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { JWTPayload } from '../types/auth.types';

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn as any,
  });
};

export default generateToken;
