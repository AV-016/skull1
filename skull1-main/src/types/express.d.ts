declare namespace Express {
  interface Request {
    rawBody?: string;
    user?: {
      id: string;
      email: string;
      role: import('@prisma/client').Role;
    };
  }
}
