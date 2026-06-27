import { User, Role } from '@prisma/client';

export interface UserProfileDTO {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  phone: string | null;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const formatUserProfile = (user: User): UserProfileDTO => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
