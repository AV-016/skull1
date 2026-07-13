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

  async bulkCreateProducts(products: CreateProductInput[]): Promise<any[]> {
    const created: any[] = [];
    
    for (const pData of products) {
      try {
        let categoryId = pData.categoryId;
        
        // Resolve categoryName if categoryId not supplied or is empty
        if ((!categoryId || categoryId.trim() === '') && pData.categoryName) {
          const categorySlug = pData.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          let category = await prisma.category.findFirst({
            where: {
              OR: [
                { name: { equals: pData.categoryName, mode: 'insensitive' } },
                { slug: categorySlug }
              ]
            }
          });
          
          if (!category) {
            category = await prisma.category.create({
              data: {
                name: pData.categoryName,
                slug: categorySlug,
                description: `Imported via bulk CSV upload`
              }
            });
          }
          categoryId = category.id;
        }

        // Handle category fallback if still not resolved
        if (!categoryId || categoryId.trim() === '') {
          const firstCategory = await prisma.category.findFirst();
          if (firstCategory) {
            categoryId = firstCategory.id;
          } else {
            const fallbackCat = await prisma.category.create({
              data: {
                name: 'General',
                slug: 'general',
                description: 'Default category for imports'
              }
            });
            categoryId = fallbackCat.id;
          }
        }

        // Generate unique slug
        const baseSlug = pData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        let slug = baseSlug;
        let counter = 1;
        while (true) {
          const existing = await prisma.product.findUnique({ where: { slug } });
          if (!existing) {
            break;
          }
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Insert product as draft
        const newProd = await productRepository.create({
          ...pData,
          categoryId,
          slug,
          isActive: false, // Draft by default
        });

        created.push({ id: newProd.id, name: newProd.name, slug: newProd.slug, success: true });
      } catch (err: any) {
        created.push({ name: pData.name, success: false, error: err.message || 'Unknown error' });
      }
    }
    
    return created;
  }

  async bulkPublishProducts(): Promise<number> {
    const result = await prisma.product.updateMany({
      where: { isActive: false },
      data: { isActive: true },
    });
    return result.count;
  }
}

export default ProductService;
