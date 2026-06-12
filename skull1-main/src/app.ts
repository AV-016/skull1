/// <reference path="./types/express.d.ts" />
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { errorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimit.middleware';

// Import routers
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import addressRoutes from './routes/address.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes, { tagRouter } from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import customRequestRoutes from './routes/customRequest.routes';
import quotationRoutes from './routes/quotation.routes';
import inquiryRoutes from './routes/inquiry.routes';
import uploadRoutes from './routes/upload.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';
import { prisma } from './config/database';

const app = express();

// 1. Global Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for local testing page resource loads
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Apply rate limiter to general API
app.use('/api', apiLimiter);

// 2. Health & Version Endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: '1.0.0',
    description: 'Skulture Backend Service',
  });
});

app.get('/api/settings', async (req, res, next) => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'global' },
    });
    res.status(200).json({
      success: true,
      data: settings || { codCharge: 50.0 },
    });
  } catch (error) {
    next(error);
  }
});

// 3. Customer & Public API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tags', tagRouter);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', reviewRoutes); // Handles reviews routes containing /api/reviews and /api/products/:productId/reviews
app.use('/api/custom-requests', customRequestRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 4. Admin Compilation Routes
app.use('/api/admin', adminRoutes);

// 5. Fallback Route Not Found
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route [${req.method}] ${req.originalUrl} not found`,
  });
});

// 6. Global Error Handler Middleware
app.use(errorHandler);

export default app;
export { app };
