import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ProductQueryFilters } from '../types/product.types';

const productService = new ProductService();

export class ProductController {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: ProductQueryFilters = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        category: req.query.category as string,
        tag: req.query.tag as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        sort: req.query.sort as any,
        q: (req.query.q || req.query.search) as string,
        showInactive: req.query.showInactive === 'true' ? true : undefined,
      };

      const result = await productService.getProducts(filters);
      res.status(200).json({
        success: true,
        message: 'Products retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Product retrieved successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductBySlug(req.params.slug);
      res.status(200).json({
        success: true,
        message: 'Product retrieved successfully by slug',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getFeaturedProducts();
      res.status(200).json({
        success: true,
        message: 'Featured products retrieved',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreateProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.bulkCreateProducts(req.body.products);
      res.status(201).json({
        success: true,
        message: 'Products imported successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkPublishProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await productService.bulkPublishProducts();
      res.status(200).json({
        success: true,
        message: `${count} products published successfully`,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deleteProduct(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.toggleActive(req.params.id);
      res.status(200).json({
        success: true,
        message: `Product isActive state toggled to ${product.isActive}`,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.toggleFeatured(req.params.id);
      res.status(200).json({
        success: true,
        message: `Product isFeatured state toggled to ${product.isFeatured}`,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  // Images
  async addImage(req: Request, res: Response, next: NextFunction) {
    try {
      const image = await productService.addProductImage(req.params.id, req.body.url);
      res.status(201).json({
        success: true,
        message: 'Image added to product',
        data: image,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deleteProductImage(req.params.imageId);
      res.status(200).json({
        success: true,
        message: 'Product image deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  async setPrimaryImage(req: Request, res: Response, next: NextFunction) {
    try {
      const image = await productService.setPrimaryImage(req.params.imageId);
      res.status(200).json({
        success: true,
        message: 'Product primary image updated',
        data: image,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getProducts({ categoryId: req.params.categoryId });
      res.status(200).json({
        success: true,
        message: 'Category products retrieved',
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductsByTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getProducts({ tagId: req.params.tagId });
      res.status(200).json({
        success: true,
        message: 'Tag products retrieved',
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ProductController;
