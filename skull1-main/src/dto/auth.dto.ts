import { User, Role } from '@prisma/client';

export interface AuthResponseDTO {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    picture: string | null;
    createdAt: Date;
    isVerified: boolean;
  };
  token: string;
}

export const formatAuthResponse = (user: User, token: string): AuthResponseDTO => {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.picture,
      createdAt: user.createdAt,
      isVerified: user.isVerified,
    },
    token,
  };
};
