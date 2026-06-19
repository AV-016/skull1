import { prisma } from '../config/database';
import { Cart, CartItem } from '@prisma/client';

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          isActive: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: {
              id: true,
              productId: true,
              url: true,
              isPrimary: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
      variant: {
        select: {
          id: true,
          productId: true,
          name: true,
          price: true,
          stock: true,
          createdAt: true,
          updatedAt: true,
          images: {
            take: 1,
            select: {
              id: true,
              variantId: true,
              url: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  },
};

export class CartRepository {
  async findByUserId(userId: string): Promise<any> {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: cartInclude,
    });

    // If no cart, create one
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: cartInclude,
      });
    }

    return cart;
  }

  async addItem(userId: string, productId: string, quantity: number = 1, variantId?: string | null): Promise<CartItem> {
    const cart = await this.findByUserId(userId);

    // Check if item already in cart with same product AND variant
    const existingItem = cart.items.find((item: any) => 
      item.productId === productId && 
      (variantId ? item.variantId === variantId : !item.variantId)
    );

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    }

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity,
      },
    });
  }

  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(itemId: string): Promise<CartItem> {
    return prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.findByUserId(userId);
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}

export default CartRepository;
