import { Role } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  tokenVersion?: number;
}

export interface UserSession {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
}
