import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { AppError } from '../middlewares/error.middleware';

const cartRepository = new CartRepository();
const productRepository = new ProductRepository();

export class CartService {
  async getCart(userId: string): Promise<any> {
    return cartRepository.findByUserId(userId);
  }

  async addToCart(userId: string, productId: string, quantity: number = 1): Promise<any> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    if (product.stock < quantity) {
      throw new AppError(400, 'Insufficient product stock');
    }

    await cartRepository.addItem(userId, productId, quantity);
    return this.getCart(userId);
  }

  async updateCartItem(userId: string, itemId: string, quantity: number): Promise<any> {
    if (quantity <= 0) {
      return this.removeFromCart(userId, itemId);
    }
    
    // Verify item belongs to user's cart
    const cart = await this.getCart(userId);
    const item = cart.items.find((i: any) => i.id === itemId);
    if (!item) {
      throw new AppError(404, 'Cart item not found');
    }

    const product = await productRepository.findById(item.productId);
    if (product && product.stock < quantity) {
      throw new AppError(400, 'Insufficient product stock');
    }

    await cartRepository.updateItemQuantity(itemId, quantity);
    return this.getCart(userId);
  }

  async removeFromCart(userId: string, itemId: string): Promise<any> {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i: any) => i.id === itemId);
    if (!item) {
      throw new AppError(404, 'Cart item not found');
    }

    await cartRepository.removeItem(itemId);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<any> {
    await cartRepository.clearCart(userId);
    return this.getCart(userId);
  }
}

export default CartService;
