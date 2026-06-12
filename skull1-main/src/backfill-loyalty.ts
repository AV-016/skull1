import { prisma } from './config/database';
import { OrderStatus, PaymentStatus } from '@prisma/client';

async function backfill() {
  console.log('Starting loyalty stamps backfill...');
  
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Find all orders that are paid or confirmed/delivered
    const eligibleOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        OR: [
          { paymentStatus: PaymentStatus.PAID },
          { status: OrderStatus.CONFIRMED },
          { status: OrderStatus.DELIVERED }
        ]
      }
    });

    const count = eligibleOrders.length;
    console.log(`User ${user.name || user.email}: found ${count} eligible orders.`);

    // Update the orders to mark stamps as awarded
    await prisma.order.updateMany({
      where: {
        id: { in: eligibleOrders.map(o => o.id) }
      },
      data: {
        loyaltyStampAwarded: true
      }
    });

    // Update the user's loyalty stamps count
    const loyaltyStamps = Math.min(8, count);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loyaltyStamps,
        loyaltyDiscountPending: loyaltyStamps >= 8
      }
    });
  }

  console.log('Loyalty stamps backfill completed successfully.');
}

backfill()
  .catch(err => {
    console.error('Error running backfill:', err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
