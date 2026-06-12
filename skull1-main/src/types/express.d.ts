declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: import('@prisma/client').Role;
    };
  }
}
