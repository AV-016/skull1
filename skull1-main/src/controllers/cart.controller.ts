import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';
import MESSAGES from '../constants/messages';

const cartService = new CartService();

export class CartController {
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cart = await cartService.getCart(userId);
      res.status(200).json({
        success: true,
        message: 'Cart retrieved successfully',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { productId, quantity } = req.body;
      const cart = await cartService.addToCart(userId, productId, quantity);
      res.status(200).json({
        success: true,
        message: MESSAGES.CART.ITEM_ADDED,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const itemId = req.params.itemId;
      const { quantity } = req.body;
      const cart = await cartService.updateCartItem(userId, itemId, quantity);
      res.status(200).json({
        success: true,
        message: MESSAGES.CART.ITEM_UPDATED,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const itemId = req.params.itemId;
      const cart = await cartService.removeFromCart(userId, itemId);
      res.status(200).json({
        success: true,
        message: MESSAGES.CART.ITEM_REMOVED,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const cart = await cartService.clearCart(userId);
      res.status(200).json({
        success: true,
        message: MESSAGES.CART.CLEARED,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CartController;
