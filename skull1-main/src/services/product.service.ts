import { ProductRepository } from '../repositories/product.repository';
import { ProductQueryFilters, CreateProductInput } from '../types/product.types';
import { ProductResponseDTO, formatProductResponse } from '../dto/product.dto';
import { AppError } from '../middlewares/error.middleware';
import { prisma } from '../config/database';
import { ProductImage } from '@prisma/client';

const productRepository = new ProductRepository();

export class ProductService {
  async getProducts(filters: ProductQueryFilters): Promise<any> {
    const { products, total } = await productRepository.findWithFilters(filters);
    const limit = filters.limit ? Number(filters.limit) : 10;
    const page = filters.page ? Number(filters.page) : 1;

    return {
      data: products.map(formatProductResponse),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(id: string): Promise<ProductResponseDTO> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    return formatProductResponse(product);
  }

  async getProductBySlug(slug: string): Promise<ProductResponseDTO> {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    return formatProductResponse(product);
  }

  async getFeaturedProducts(): Promise<ProductResponseDTO[]> {
    const products = await productRepository.findFeatured();
    return products.map(formatProductResponse);
  }

  async createProduct(data: CreateProductInput): Promise<ProductResponseDTO> {
    const product = await productRepository.create(data);
    const fullProduct = await productRepository.findById(product.id);
    if (!fullProduct) {
      throw new AppError(500, 'Error creating product details');
    }
    return formatProductResponse(fullProduct);
  }

  async updateProduct(id: string, data: any): Promise<ProductResponseDTO> {
    await this.getProductById(id);
    await productRepository.update(id, data);
    const fullProduct = await productRepository.findById(id);
    if (!fullProduct) {
      throw new AppError(500, 'Error loading updated product');
    }
    return formatProductResponse(fullProduct);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id);
    await productRepository.delete(id);
  }

  async toggleActive(id: string): Promise<ProductResponseDTO> {
    const product = await this.getProductById(id);
    await productRepository.update(id, { isActive: !product.isActive });
    const fullProduct = await productRepository.findById(id);
    return formatProductResponse(fullProduct!);
  }

  async toggleFeatured(id: string): Promise<ProductResponseDTO> {
    const product = await this.getProductById(id);
    await productRepository.update(id, { isFeatured: !product.isFeatured });
    const fullProduct = await productRepository.findById(id);
    return formatProductResponse(fullProduct!);
  }

  // Image operations
  async addProductImage(productId: string, url: string): Promise<ProductImage> {
    await this.getProductById(productId);
    
    // Check if there's already a primary image
    const existingPrimary = await prisma.productImage.findFirst({
      where: { productId, isPrimary: true },
    });

    return prisma.productImage.create({
      data: {
        productId,
        url,
        isPrimary: !existingPrimary,
      },
    });
  }

  async deleteProductImage(imageId: string): Promise<void> {
    const img = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img) {
      throw new AppError(404, 'Image not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: imageId } });

      // If we deleted the primary image, set another one as primary
      if (img.isPrimary) {
        const anotherImg = await tx.productImage.findFirst({
          where: { productId: img.productId },
        });
        if (anotherImg) {
          await tx.productImage.update({
            where: { id: anotherImg.id },
            data: { isPrimary: true },
          });
        }
      }
    });
  }

  async setPrimaryImage(imageId: string): Promise<ProductImage> {
    const img = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img) {
      throw new AppError(404, 'Image not found');
    }

    return prisma.$transaction(async (tx) => {
      await tx.productImage.updateMany({
        where: { productId: img.productId },
        data: { isPrimary: false },
      });

      return tx.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });
  }
}

export default ProductService;
