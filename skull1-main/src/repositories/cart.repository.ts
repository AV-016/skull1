import { prisma } from '../config/database';
import { Cart, CartItem } from '@prisma/client';

export class CartRepository {
  async findByUserId(userId: string): Promise<any> {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    // If no cart, create one
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addItem(userId: string, productId: string, quantity: number = 1): Promise<CartItem> {
    const cart = await this.findByUserId(userId);

    // Check if item already in cart
    const existingItem = cart.items.find((item: any) => item.productId === productId);

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
