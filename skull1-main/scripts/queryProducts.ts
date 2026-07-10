import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
      bestSellerOrder: true,
      price: true,
      images: {
        select: {
          url: true,
          isPrimary: true
        }
      }
    }
  })
  console.log(JSON.stringify(products, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
