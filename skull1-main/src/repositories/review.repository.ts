import { prisma } from '../config/database';
import { Review, Prisma } from '@prisma/client';
import { ReviewWithDetails } from '../dto/review.dto';

export class ReviewRepository {
  async findById(id: string): Promise<ReviewWithDetails | null> {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: true,
        images: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            compareAtPrice: true,
            stock: true,
            isActive: true,
            isFeatured: true,
            categoryId: true,
            specifications: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    }) as Promise<ReviewWithDetails | null>;
  }

  async findByProductId(productId: string): Promise<ReviewWithDetails[]> {
    return prisma.review.findMany({
      where: { productId, isHidden: false },
      include: {
        user: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<ReviewWithDetails[]>;
  }

  async findAll(page: number = 1, limit: number = 10, userId?: string): Promise<{ reviews: ReviewWithDetails[]; total: number }> {
    const skip = (page - 1) * limit;
    const whereClause = userId ? { userId } : {};
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          user: true,
          images: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              price: true,
              compareAtPrice: true,
              stock: true,
              isActive: true,
              isFeatured: true,
              categoryId: true,
              specifications: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: whereClause }),
    ]);

    return {
      reviews: reviews as ReviewWithDetails[],
      total,
    };
  }

  async create(data: {
    productId: string;
    userId: string;
    rating: number;
    comment?: string;
    images?: string[];
  }): Promise<Review> {
    const { productId, userId, rating, comment, images = [] } = data;
    return prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        comment,
        images: {
          create: images.map((url) => ({ url })),
        },
      },
    });
  }

  async update(id: string, data: Prisma.ReviewUpdateInput): Promise<Review> {
    return prisma.review.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Review> {
    return prisma.review.delete({
      where: { id },
    });
  }

  async setVisibility(id: string, isHidden: boolean): Promise<Review> {
    return prisma.review.update({
      where: { id },
      data: { isHidden },
    });
  }
}

export default ReviewRepository;
