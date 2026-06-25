import request from 'supertest';
import { prisma } from '../src/config/database';
import app from '../src/app';
import { razorpay } from '../src/config/razorpay';
import * as mailUtils from '../src/utils/mail';
import * as cloudinaryUpload from '../src/utils/cloudinaryUpload';
import * as razorpayVerify from '../src/utils/razorpayVerify';
import logger from '../src/utils/logger';

// Disable real email/SMS/Cloudinary/Razorpay network requests by stubbing them
Object.defineProperty(mailUtils, 'sendOtpEmail', {
  value: async () => { logger.info('[MOCK] sendOtpEmail bypassed.'); },
  writable: true
});
Object.defineProperty(mailUtils, 'sendOrderConfirmationEmail', {
  value: async () => { logger.info('[MOCK] sendOrderConfirmationEmail bypassed.'); },
  writable: true
});
Object.defineProperty(mailUtils, 'sendPasswordResetOtpEmail', {
  value: async () => { logger.info('[MOCK] sendPasswordResetOtpEmail bypassed.'); },
  writable: true
});

Object.defineProperty(cloudinaryUpload, 'uploadToCloudinary', {
  value: async () => ({
    secure_url: 'https://res.cloudinary.com/dummy-cloud/image/upload/v1/dummy.png',
    public_id: 'dummy_public_id'
  }),
  writable: true
});
Object.defineProperty(cloudinaryUpload, 'deleteFromCloudinary', {
  value: async () => ({ result: 'ok' }),
  writable: true
});

Object.defineProperty(razorpayVerify, 'verifyRazorpaySignature', {
  value: () => true,
  writable: true
});
Object.defineProperty(razorpayVerify, 'verifyWebhookSignature', {
  value: () => true,
  writable: true
});

// Mock Razorpay order creation
(razorpay.orders as any).create = async (options: any) => {
  return {
    id: `order_dummy_${Math.random().toString(36).substring(7)}`,
    amount: options.amount,
    currency: options.currency,
    receipt: options.receipt,
    status: 'created',
    entity: 'order',
    amount_paid: 0,
    amount_due: options.amount,
    attempts: 0,
    created_at: Math.floor(Date.now() / 1000),
    notes: options.notes || []
  };
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const testResults: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  logger.info(`Running test: ${name}...`);
  try {
    await fn();
    testResults.push({ name, passed: true });
    logger.info(`✓ PASSED: ${name}`);
  } catch (err: any) {
    testResults.push({ name, passed: false, error: err.message });
    logger.error(`✗ FAILED: ${name}`);
    logger.error(err);
  }
}

async function main() {
  logger.info('==================================================');
  logger.info('STARTING COMPREHENSIVE USER/ADMIN ROUTE VALIDATION');
  logger.info('==================================================');

  // Verify database contains test accounts and category/product to use
  const bcrypt = require('bcrypt');

  logger.info('Upserting verified customer account...');
  const userPasswordHash = await bcrypt.hash('CustomerPassword123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'customer@skulture.com' },
    update: {
      password: userPasswordHash,
      isVerified: true,
      role: 'CUSTOMER'
    },
    create: {
      email: 'customer@skulture.com',
      password: userPasswordHash,
      name: 'John Doe',
      isVerified: true,
      role: 'CUSTOMER'
    }
  });

  logger.info('Upserting verified admin account...');
  const adminPasswordHash = await bcrypt.hash('AdminPassword123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@skulture.com' },
    update: {
      password: adminPasswordHash,
      isVerified: true,
      role: 'ADMIN'
    },
    create: {
      email: 'admin@skulture.com',
      password: adminPasswordHash,
      name: 'Skulture Admin',
      role: 'ADMIN',
      isVerified: true
    }
  });

  let category = await prisma.category.findFirst();
  if (!category) {
    logger.info('Seeding test category...');
    category = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category description'
      }
    });
  }

  let product = await prisma.product.findFirst();
  if (!product) {
    logger.info('Seeding test product...');
    product = await prisma.product.create({
      data: {
        name: 'Test Product',
        slug: 'test-product-' + Date.now(),
        description: 'Test product description',
        price: 100,
        stock: 10,
        categoryId: category.id
      }
    });
  }

  let userToken = '';
  let adminToken = '';
  let addressId = '';
  let orderId = '';
  let customRequestId = '';
  let quotationId = '';
  let reviewId = '';
  let inquiryId = '';

  // 1. Setup & Health checks
  await runTest('System Health and Version endpoints', async () => {
    const resHealth = await request(app).get('/api/health');
    if (resHealth.status !== 200 || !resHealth.body.success) {
      throw new Error('Health check returned non-200 or failure');
    }

    const resVersion = await request(app).get('/api/version');
    if (resVersion.status !== 200 || resVersion.body.version !== '1.0.0') {
      throw new Error('Version check returned non-200 or wrong version');
    }
  });

  // 2. Authentication Flow (User login)
  await runTest('User Login Authenticate', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer@skulture.com',
        password: 'CustomerPassword123'
      });
    if (res.status !== 200 || !res.body.success || !res.body.data?.token) {
      throw new Error(`Login failed: ${res.body.message || res.status}`);
    }
    userToken = res.body.data.token;
  });

  // 2b. Invalid User Login check
  await runTest('User Login with incorrect password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer@skulture.com',
        password: 'WrongPassword'
      });
    if (res.status !== 401) {
      throw new Error(`Expected 401 status, got ${res.status}`);
    }
  });

  // 3. User Profile & Address Operations
  await runTest('User Profile retrieval', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`);
    if (res.status !== 200 || res.body.data.email !== 'customer@skulture.com') {
      throw new Error(`Expected profile, got status ${res.status}`);
    }
  });

  await runTest('User Create & Get Address', async () => {
    const resAdd = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        street: '456 Test Lane',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        phone: '9876543210',
        isDefault: true
      });
    if (resAdd.status !== 201 || !resAdd.body.data.id) {
      throw new Error(`Create address failed: ${resAdd.status}`);
    }
    addressId = resAdd.body.data.id;

    const resGet = await request(app)
      .get('/api/addresses')
      .set('Authorization', `Bearer ${userToken}`);
    if (resGet.status !== 200 || resGet.body.data.length === 0) {
      throw new Error(`Get addresses failed: ${resGet.status}`);
    }
  });

  // 4. Cart management
  await runTest('User Cart CRUD operations', async () => {
    // 1. Clear cart
    await prisma.cartItem.deleteMany({ where: { cart: { userId: user!.id } } });

    // 2. Add to cart
    const resAdd = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: product!.id,
        quantity: 2
      });
    if (resAdd.status !== 200 && resAdd.status !== 201) {
      throw new Error(`Add cart item failed: ${resAdd.status}`);
    }

    // 3. View cart
    const resGet = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${userToken}`);
    if (resGet.status !== 200 || resGet.body.data.items.length !== 1) {
      throw new Error(`View cart failed: ${resGet.status}`);
    }
    const cartItemId = resGet.body.data.items[0].id;

    // 4. Update cart item quantity
    const resUpdate = await request(app)
      .patch(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        quantity: 5
      });
    if (resUpdate.status !== 200) {
      throw new Error(`Update cart item failed: ${resUpdate.status}`);
    }

    // 5. Delete cart item
    const resDelete = await request(app)
      .delete(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${userToken}`);
    if (resDelete.status !== 200) {
      throw new Error(`Delete cart item failed: ${resDelete.status}`);
    }
  });

  // 5. Checkout & Order Tracking
  await runTest('Checkout & Order Placement with Idempotency Key', async () => {
    // Add item back to cart to checkout
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ productId: product!.id, quantity: 2 });

    const uniqueKey = `test-page-key-${Date.now()}`;
    const resOrder = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        addressId,
        paymentMethod: 'CARD',
        idempotencyKey: uniqueKey
      });
    if (resOrder.status !== 201 || !resOrder.body.data.id) {
      throw new Error(`Create order failed: ${resOrder.status} - ${resOrder.body.message}`);
    }
    orderId = resOrder.body.data.id;

    // Verify order retrieved in orders list
    const resList = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`);
    if (resList.status !== 200 || resList.body.data.length === 0) {
      throw new Error('Get orders list failed');
    }

    // Verify order details retrieval
    const resGet = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);
    if (resGet.status !== 200 || resGet.body.data.id !== orderId) {
      throw new Error('Get order details by ID failed');
    }
  });

  // 6. Custom Requests
  await runTest('User Custom Request submission', async () => {
    const res = await request(app)
      .post('/api/custom-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        description: 'Need a custom low-poly vase',
        requirements: 'Height: 20cm, Material: PLA, Color: Gold'
      });
    if (res.status !== 201 || !res.body.data.id) {
      throw new Error(`Create custom request failed: ${res.status}`);
    }
    customRequestId = res.body.data.id;

    const resGet = await request(app)
      .get('/api/custom-requests')
      .set('Authorization', `Bearer ${userToken}`);
    if (resGet.status !== 200 || resGet.body.data.length === 0) {
      throw new Error('Get custom requests failed');
    }
  });

  // 7. Ticketing & Inquiries
  await runTest('User Inquiry submission', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({
        name: 'John Doe',
        email: 'customer@skulture.com',
        subject: 'Filament quality inquiry',
        message: 'Could you tell me what brand of filament you use?'
      });
    if (res.status !== 201 || !res.body.data.id) {
      throw new Error(`Create inquiry failed: ${res.status}`);
    }
    inquiryId = res.body.data.id;
  });

  // 8. Product Reviews
  await runTest('User Review creation', async () => {
    const res = await request(app)
      .post(`/api/products/${product!.id}/reviews`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        rating: 5,
        comment: 'This test product is extremely detailed and robust! Highly recommended.'
      });
    if (res.status !== 201 || !res.body.data.id) {
      throw new Error(`Create review failed: ${res.status}`);
    }
    reviewId = res.body.data.id;
  });

  // 9. Admin Authentication
  await runTest('Admin Login Authenticate', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@skulture.com',
        password: 'AdminPassword123'
      });
    if (res.status !== 200 || !res.body.success || !res.body.data?.token) {
      throw new Error(`Admin login failed: ${res.status}`);
    }
    adminToken = res.body.data.token;
  });

  // 10. Admin Dashboards & Stats
  await runTest('Admin Dashboard and Monitoring metrics', async () => {
    const resDash = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    if (resDash.status !== 200 || !resDash.body.success) {
      throw new Error(`Admin dashboard stats failed: ${resDash.status}`);
    }

    const resMon = await request(app)
      .get('/api/admin/monitoring/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    if (resMon.status !== 200 || !resMon.body.success) {
      throw new Error(`Admin monitoring stats failed: ${resMon.status}`);
    }
  });

  // 11. Admin Business Settings
  await runTest('Admin Business Settings operations', async () => {
    const resGet = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`);
    if (resGet.status !== 200) {
      throw new Error('Admin get settings failed');
    }

    const resUpdate = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        businessName: 'Skulture Pro 3D',
        codCharge: 40.0
      });
    if (resUpdate.status !== 200 || resUpdate.body.data.businessName !== 'Skulture Pro 3D') {
      throw new Error('Admin update settings failed');
    }
  });

  // 12. Admin Catalog Management
  await runTest('Admin Category & Product creation', async () => {
    const uniqueSlug = 'cat-' + Date.now();
    const resCat = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Category ' + Date.now(),
        slug: uniqueSlug,
        description: 'New admin category'
      });
    if (resCat.status !== 201) {
      throw new Error(`Admin create category failed: ${resCat.status}`);
    }
    const catId = resCat.body.data.id;

    const resProd = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Product ' + Date.now(),
        slug: 'admin-prod-' + Date.now(),
        description: 'Created by admin controller',
        price: 150.0,
        stock: 20,
        categoryId: catId
      });
    if (resProd.status !== 201) {
      throw new Error(`Admin create product failed: ${resProd.status}`);
    }
  });

  // 13. Admin Order Resolutions (Manual overrides)
  await runTest('Admin Order manual Mark Paid resolution', async () => {
    const res = await request(app)
      .post(`/api/admin/orders/${orderId}/mark-paid`)
      .set('Authorization', `Bearer ${adminToken}`);
    if (res.status !== 200 || res.body.data.paymentStatus !== 'PAID' || res.body.data.status !== 'CONFIRMED') {
      throw new Error(`Manual mark paid failed: ${res.status}`);
    }
  });

  await runTest('Admin Order manual Refund & Restock resolution', async () => {
    const stockBefore = (await prisma.product.findUnique({ where: { id: product!.id } }))?.stock || 0;

    const res = await request(app)
      .post(`/api/admin/orders/${orderId}/refund`)
      .set('Authorization', `Bearer ${adminToken}`);
    if (res.status !== 200 || res.body.data.paymentStatus !== 'REFUNDED' || res.body.data.status !== 'CANCELLED') {
      throw new Error(`Manual refund failed: ${res.status}`);
    }

    const orderItems = await prisma.orderItem.findMany({
      where: { orderId }
    });
    const expectedIncrement = orderItems
      .filter(item => item.productId === product!.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    const stockAfter = (await prisma.product.findUnique({ where: { id: product!.id } }))?.stock || 0;
    if (stockAfter !== stockBefore + expectedIncrement) {
      throw new Error(`Expected restocking of ${expectedIncrement} items, got stock change from ${stockBefore} to ${stockAfter}`);
    }
  });

  // 14. Admin Custom Request Quotations
  await runTest('Admin Custom Request Quotation workflow', async () => {
    // 1. Create quotation as Admin
    const resQuotation = await request(app)
      .post('/api/admin/quotations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customRequestId,
        price: 350.0,
        notes: 'Includes post-processing and gold filament',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    if (resQuotation.status !== 201 || !resQuotation.body.data.id) {
      throw new Error(`Admin create quotation failed: ${resQuotation.status}`);
    }
    quotationId = resQuotation.body.data.id;

    // 2. Accept quotation as Customer
    const resAccept = await request(app)
      .post(`/api/quotations/${quotationId}/accept`)
      .set('Authorization', `Bearer ${userToken}`);
    if (resAccept.status !== 200 || resAccept.body.data.status !== 'ACCEPTED') {
      throw new Error(`Customer accept quotation failed: ${resAccept.status}`);
    }
  });

  // 15. Admin Ticketing Response
  await runTest('Admin Inquiry ticketing response', async () => {
    const res = await request(app)
      .post(`/api/admin/inquiries/${inquiryId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        message: 'We use high-quality eSUN and Hatchbox filaments for our PLA prints.'
      });
    if (res.status !== 201) {
      throw new Error(`Admin reply to inquiry failed: ${res.status}`);
    }
  });

  // 16. Admin Review Moderation
  await runTest('Admin Review moderation (Hide/Unhide)', async () => {
    const res = await request(app)
      .patch(`/api/admin/reviews/${reviewId}/hide`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isHidden: true });
    if (res.status !== 200 && res.status !== 204) {
      throw new Error(`Admin hide review failed: ${res.status}`);
    }
  });

  logger.info('==================================================');
  logger.info('TEST VALIDATION EXECUTION SUMMARY');
  logger.info('==================================================');
  let allPassed = true;
  for (const result of testResults) {
    const statusSymbol = result.passed ? '✅' : '❌';
    logger.info(`${statusSymbol} [${result.passed ? 'PASS' : 'FAIL'}] ${result.name}`);
    if (!result.passed && result.error) {
      logger.info(`    Error: ${result.error}`);
      allPassed = false;
    }
  }
  logger.info('==================================================');

  await prisma.$disconnect();

  if (allPassed) {
    logger.info('🎉 SUCCESS: All user and admin page functions tested successfully!');
    process.exit(0);
  } else {
    logger.error('❌ FAILURE: Some integration test assertions failed.');
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error('Unhandled exception running tests:', err);
  process.exit(1);
});
