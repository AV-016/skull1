import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean up existing data to allow repeated seeding
  await prisma.cart.deleteMany({});
  await prisma.address.deleteMany({});

  // 1. Settings
  await prisma.settings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      businessName: 'Skulture 3D Printing',
      upiId: 'pay@skulture',
      supportEmail: 'support@skulture.com',
      supportPhone: '+1234567890',
    },
  });

  // 2. Users (Admin and Customer)
  const adminPasswordHash = await bcrypt.hash('AdminPassword123', 10);
  const customerPasswordHash = await bcrypt.hash('CustomerPassword123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@skulture.com' },
    update: {},
    create: {
      email: 'admin@skulture.com',
      password: adminPasswordHash,
      name: 'Skulture Admin',
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@skulture.com' },
    update: {},
    create: {
      email: 'customer@skulture.com',
      password: customerPasswordHash,
      name: 'John Doe',
      role: Role.CUSTOMER,
    },
  });

  console.log(`Seeded users: Admin: ${admin.email}, Customer: ${customer.email}`);

  // 3. Addresses
  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      street: '123 Maker Street',
      city: 'Print City',
      state: 'Filament State',
      postalCode: '12345',
      country: 'MakerLand',
      isDefault: true,
    },
  });

  // 4. Categories
  const catMinis = await prisma.category.upsert({
    where: { slug: 'miniatures' },
    update: {},
    create: {
      name: 'Miniatures',
      slug: 'miniatures',
      description: 'High-detail tabletop figures and models',
    },
  });

  const catFunctional = await prisma.category.upsert({
    where: { slug: 'functional-prints' },
    update: {},
    create: {
      name: 'Functional Prints',
      slug: 'functional-prints',
      description: 'Useful tools, brackets, and household objects',
    },
  });

  const catArt = await prisma.category.upsert({
    where: { slug: 'sculptures-and-art' },
    update: {},
    create: {
      name: 'Sculptures & Art',
      slug: 'sculptures-and-art',
      description: 'Artistic designs and beautiful display pieces',
    },
  });

  // 5. Tags
  const tagTabletop = await prisma.tag.upsert({
    where: { slug: 'tabletop' },
    update: {},
    create: { name: 'Tabletop', slug: 'tabletop' },
  });

  const tagResin = await prisma.tag.upsert({
    where: { slug: 'resin' },
    update: {},
    create: { name: 'Resin', slug: 'resin' },
  });

  const tagPLA = await prisma.tag.upsert({
    where: { slug: 'pla' },
    update: {},
    create: { name: 'PLA', slug: 'pla' },
  });

  const tagAnime = await prisma.tag.upsert({
    where: { slug: 'anime' },
    update: {},
    create: { name: 'Anime', slug: 'anime' },
  });

  // 6. Products
  const p1 = await prisma.product.upsert({
    where: { slug: 'cyberpunk-warrior' },
    update: {},
    create: {
      name: 'Cyberpunk Warrior Mini',
      slug: 'cyberpunk-warrior',
      description: 'A 32mm scale sci-fi cyberpunk warrior figurine, printed in high-res resin.',
      price: 15.99,
      compareAtPrice: 19.99,
      stock: 50,
      isActive: true,
      isFeatured: true,
      categoryId: catMinis.id,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/skulture/image/upload/v1/cyberpunk_primary.jpg', isPrimary: true },
          { url: 'https://res.cloudinary.com/skulture/image/upload/v1/cyberpunk_detail.jpg', isPrimary: false },
        ],
      },
      tags: {
        connect: [{ id: tagTabletop.id }, { id: tagResin.id }],
      },
    },
  });

  const p2 = await prisma.product.upsert({
    where: { slug: 'ergonomic-headphone-stand' },
    update: {},
    create: {
      name: 'Ergonomic Headphone Stand',
      slug: 'ergonomic-headphone-stand',
      description: 'Sleek, minimalist headphone stand printed in durable black PLA.',
      price: 24.99,
      stock: 30,
      isActive: true,
      isFeatured: false,
      categoryId: catFunctional.id,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/skulture/image/upload/v1/headphone_stand.jpg', isPrimary: true },
        ],
      },
      tags: {
        connect: [{ id: tagPLA.id }],
      },
    },
  });

  const p3 = await prisma.product.upsert({
    where: { slug: 'low-poly-thinker-sculpture' },
    update: {},
    create: {
      name: 'Low-Poly Thinker Sculpture',
      slug: 'low-poly-thinker-sculpture',
      description: 'Modern geometric representation of the classic Thinker statue.',
      price: 35.00,
      compareAtPrice: 45.00,
      stock: 15,
      isActive: true,
      isFeatured: true,
      categoryId: catArt.id,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/skulture/image/upload/v1/thinker_primary.jpg', isPrimary: true },
        ],
      },
      tags: {
        connect: [{ id: tagPLA.id }, { id: tagTabletop.id }],
      },
    },
  });

  // 7. Cart
  await prisma.cart.create({
    data: {
      userId: customer.id,
      items: {
        create: [
          { productId: p1.id, quantity: 2 },
          { productId: p2.id, quantity: 1 },
        ],
      },
    },
  });

  console.log('Seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
