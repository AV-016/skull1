import { prisma } from './config/database';

async function test() {
  const user = await prisma.user.findUnique({
    where: { email: 'aryansri.coc@gmail.com' }
  });
  console.log('USER FROM DB:', user);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
