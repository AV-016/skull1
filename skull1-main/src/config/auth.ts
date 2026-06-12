import { env } from './env';

export const authConfig = {
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  googleClientId: env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: `http://localhost:${env.PORT}/api/auth/google/callback`,
  frontendUrl: env.FRONTEND_URL,
};

export default authConfig;
