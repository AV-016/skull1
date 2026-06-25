import { prisma } from '../src/config/database';
import { OrderService } from '../src/services/order.service';
import logger from '../src/utils/logger';

const orderService = new OrderService();

async function run() {
  logger.info('Starting inventory race condition load test...');

  // 1. Find or create a test user
  let user = await prisma.user.findFirst({
    include: { addresses: true }
  });
  if (!user) {
    logger.error('No users found in database to run load test. Please run seed script first.');
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

  // 2. Create a temporary test product with stock = 1
  const product = await prisma.product.create({
    data: {
      name: 'Race Test Product',
      slug: 'race-test-product-' + Date.now(),
      description: 'Used for inventory race condition stress testing',
      price: 100,
      stock: 1,
      isActive: true,
      categoryId: (await prisma.category.findFirst())?.id || 'dummy_cat_id'
    }
  });

  logger.info(`Created test product "${product.name}" with stock = 1.`);

  // 3. Clear user's cart and add the test product to it
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

  logger.info(`Setup cart for user ${user.email} with 1 units of test product.`);

  // 4. Fire 20 concurrent order placements
  logger.info('Firing 20 concurrent checkout requests...');
  const promises = [];
  for (let i = 0; i < 20; i++) {
    const key = `key-${i}-${Date.now()}`;
    promises.push(
      orderService.createOrder(user.id, address.id, 'COD', key)
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

  logger.info('--- LOAD TEST RESULTS ---');
  logger.info(`Total requests fired: 20`);
  logger.info(`Successful orders: ${successes.length}`);
  logger.info(`Failed orders: ${failures.length}`);
  
  if (failures.length > 0) {
    logger.info(`Sample failure error message: "${(failures[0] as any).error}"`);
  }

  // 5. Assert product stock and cleanup
  const updatedProduct = await prisma.product.findUnique({
    where: { id: product.id }
  });

  logger.info(`Ending stock level: ${updatedProduct?.stock}`);

  let testPassed = successes.length === 1 && failures.length === 19 && updatedProduct?.stock === 0;

  if (testPassed) {
    logger.info('✅ SUCCESS: Race condition load test passed! Exactly 1 order succeeded and inventory did not oversell.');
  } else {
    logger.error('❌ FAILURE: Load test failed. Inventory oversold or unexpected number of successes.');
  }

  // Clean up test data
  logger.info('Cleaning up test product and associated orders...');
  await prisma.orderItem.deleteMany({
    where: { productId: product.id }
  });
  await prisma.product.delete({
    where: { id: product.id }
  });

  process.exit(testPassed ? 0 : 1);
}

run().catch((err) => {
  logger.error('Error running load test:', err);
  process.exit(1);
});
