import { prisma } from '../src/config/database';
import { OrderService } from '../src/services/order.service';
import logger from '../src/utils/logger';

const orderService = new OrderService();

async function run() {
  logger.info('Starting checkout double-submit idempotency key test...');

  // 1. Find or create a test user
  let user = await prisma.user.findFirst({
    include: { addresses: true }
  });
  if (!user) {
    logger.error('No users found in database.');
    process.exit(1);
  }
  
  let address = user.addresses[0];
  if (!address) {
    address = await prisma.address.create({
      data: {
        userId: user.id,
        street: '123 Test St',
        city: 'Test City',
        state: 'N/A',
        postalCode: '111111',
        country: 'India',
        phone: '1234567890',
        isDefault: true
      }
    });
  }

  // 2. Create a test product with stock = 10
  const product = await prisma.product.create({
    data: {
      name: 'Idempotency Test Product',
      slug: 'idempotency-test-product-' + Date.now(),
      description: 'Used for idempotency testing',
      price: 100,
      stock: 10,
      isActive: true,
      categoryId: (await prisma.category.findFirst())?.id || 'dummy_cat_id'
    }
  });

  // 3. Clear user's cart and add the test product
  await prisma.cartItem.deleteMany({
    where: { cart: { userId: user.id } }
  });

  let cart = await prisma.cart.findUnique({
    where: { userId: user.id }
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: user.id }
    });
  }

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      quantity: 1
    }
  });

  // 4. Fire 5 requests in parallel with the SAME idempotency key
  const sharedKey = `shared-idempotency-key-${Date.now()}`;
  logger.info(`Firing 5 concurrent requests with identical idempotency key: ${sharedKey}`);

  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      orderService.createOrder(user.id, address.id, 'COD', sharedKey)
        .then((order) => {
          return { success: true, orderId: order.id };
        })
        .catch((err) => {
          return { success: false, error: err.message };
        })
    );
  }

  const results = await Promise.all(promises);

  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);

  logger.info('--- IDEMPOTENCY TEST RESULTS ---');
  logger.info(`Total requests fired: 5`);
  logger.info(`Successful responses: ${successes.length}`);
  logger.info(`Failed/deduped responses: ${failures.length}`);
  if (failures.length > 0) {
    logger.info(`Sample failure error message: "${(failures[0] as any).error}"`);
  }

  // Query how many orders are actually created in database with this key
  const createdOrders = await prisma.order.findMany({
    where: { idempotencyKey: sharedKey }
  });

  logger.info(`Actual database order count with key: ${createdOrders.length}`);

  let testPassed = successes.length === 5 && createdOrders.length === 1;

  if (testPassed) {
    logger.info('✅ SUCCESS: Idempotency key test passed! 5 duplicate submissions returned successfully but only 1 order was created.');
  } else {
    logger.error('❌ FAILURE: Idempotency test failed. Multiple orders created or failures returned.');
  }

  // Clean up
  logger.info('Cleaning up idempotency test data...');
  await prisma.orderItem.deleteMany({
    where: { productId: product.id }
  });
  await prisma.order.deleteMany({
    where: { idempotencyKey: sharedKey }
  });
  await prisma.product.delete({
    where: { id: product.id }
  });

  process.exit(testPassed ? 0 : 1);
}

run().catch((err) => {
  logger.error('Error running idempotency test:', err);
  process.exit(1);
});
