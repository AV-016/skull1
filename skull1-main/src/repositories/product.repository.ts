import { prisma } from '../config/database';
import { Product, Prisma } from '@prisma/client';
import { ProductQueryFilters, CreateProductInput } from '../types/product.types';
import { ProductWithDetails } from '../dto/product.dto';

const productInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    select: {
      id: true,
      url: true,
      isPrimary: true,
    },
  },
  variants: {
    select: {
      id: true,
      productId: true,
      name: true,
      price: true,
      stock: true,
      createdAt: true,
      updatedAt: true,
      images: {
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
  tags: {
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  reviews: {
    select: {
      id: true,
      productId: true,
      userId: true,
      rating: true,
      comment: true,
      isHidden: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  orderItems: {
    select: {
      id: true,
      orderId: true,
      productId: true,
      variantId: true,
      quantity: true,
      price: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  events: {
    select: {
      id: true,
      title: true,
      discountPercentage: true,
      startDate: true,
      endDate: true,
      isActive: true,
    },
  },
};

export class ProductRepository {
  async findById(id: string): Promise<ProductWithDetails | null> {
    return prisma.product.findUnique({
      where: { id },
      include: productInclude,
    }) as Promise<ProductWithDetails | null>;
  }

  async findBySlug(slug: string): Promise<ProductWithDetails | null> {
    return prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    }) as Promise<ProductWithDetails | null>;
  }

  async findFeatured(): Promise<ProductWithDetails[]> {
    return prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: productInclude,
    }) as Promise<ProductWithDetails[]>;
  }

  async findWithFilters(filters: ProductQueryFilters): Promise<{ products: ProductWithDetails[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      featured,
      category,
      tag,
      minPrice,
      maxPrice,
      sort,
      q,
      categoryId,
      tagId,
      showInactive,
    } = filters;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ProductWhereInput = {};
    if (!showInactive) {
      whereClause.isActive = true;
    }

    if (featured !== undefined) {
      whereClause.isFeatured = featured;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    } else if (category) {
      const formattedSlug = category.toLowerCase().replace(/\+/g, '-').replace(/\s+/g, '-');
      whereClause.category = {
        OR: [
          { slug: { equals: category, mode: 'insensitive' } },
          { name: { equals: category, mode: 'insensitive' } },
          { slug: { equals: formattedSlug, mode: 'insensitive' } }
        ]
      };
    }

    if (tagId) {
      whereClause.tags = { some: { id: tagId } };
    } else if (tag) {
      whereClause.tags = { some: { slug: tag } };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};
      if (minPrice !== undefined) whereClause.price.gte = minPrice;
      if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'bestsellers') {
      orderBy = { bestSellerOrder: 'desc' };
    } else if (sort === 'newest' || sort === 'new') {
      orderBy = { createdAt: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: productInclude,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return {
      products: products as ProductWithDetails[],
      total,
    };
  }

  async create(data: CreateProductInput): Promise<Product> {
    const { name, description, price, compareAtPrice, stock, categoryId, tags = [], images = [], variants = [], specifications = null, bestSellerOrder = 0 } = data;
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    return prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        compareAtPrice,
        stock,
        categoryId,
        bestSellerOrder,
        specifications: specifications || undefined,
        tags: {
          connect: tags.map((id) => ({ id })),
        },
        images: {
          create: images.map((url, index) => ({
            url,
            isPrimary: index === 0,
          })),
        },
        variants: {
          create: variants.map((v) => ({
            name: v.name,
            price: v.price,
            stock: v.stock,
            images: {
              create: (v.images || []).map((url) => ({
                url,
              })),
            },
          })),
        },
      },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    const { images, variants, tags, ...updateData } = data as any;
    
    return prisma.$transaction(async (tx) => {
      // 1. Update main images
      if (images && Array.isArray(images)) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((url, index) => ({
              productId: id,
              url,
              isPrimary: index === 0,
            })),
          });
        }
      }

      // 2. Update variants
      if (variants && Array.isArray(variants)) {
        // Delete existing variants
        await tx.productVariant.deleteMany({ where: { productId: id } });
        
        // Re-create variants with their images
        for (const v of variants) {
          await tx.productVariant.create({
            data: {
              productId: id,
              name: v.name,
              price: v.price,
              stock: v.stock,
              images: {
                create: (v.images || []).map((url: string) => ({
                  url,
                })),
              },
            },
          });
        }
      }
      
      return tx.product.update({
        where: { id },
        data: {
          ...updateData,
          ...(tags && Array.isArray(tags) ? {
            tags: {
              set: tags.map((tagId: string) => ({ id: tagId }))
            }
          } : {})
        },
      });
    });
  }

  async delete(id: string): Promise<Product> {
    return prisma.product.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return prisma.product.count();
  }
}

export default ProductRepository;
