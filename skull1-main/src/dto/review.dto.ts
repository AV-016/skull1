import { Review, ReviewImage, User, Product } from '@prisma/client';

export interface ReviewResponseDTO {
  id: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  user: {
    id: string;
    name: string | null;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
  };
  images: {
    id: string;
    url: string;
  }[];
  createdAt: Date;
}

export type ReviewWithDetails = Review & {
  user: User;
  images: ReviewImage[];
  product?: Product;
};

export const formatReviewResponse = (review: ReviewWithDetails): ReviewResponseDTO => {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    isHidden: review.isHidden,
    user: {
      id: review.user.id,
      name: review.user.name,
    },
    product: review.product ? {
      id: review.product.id,
      name: review.product.name,
      slug: review.product.slug,
    } : undefined,
    images: review.images.map((img) => ({
      id: img.id,
      url: img.url,
    })),
    createdAt: review.createdAt,
  };
};
