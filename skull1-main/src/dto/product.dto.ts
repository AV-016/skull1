import { Product, ProductImage, Tag, Category, Review, ProductVariant, ProductVariantImage } from '@prisma/client';

export interface ProductResponseDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
  variants: {
    id: string;
    name: string;
    price: number | null;
    stock: number;
    images: string[];
  }[];
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
  rating: number;
  reviewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductWithDetails = Product & {
  category: Category;
  images: ProductImage[];
  variants: (ProductVariant & {
    images: ProductVariantImage[];
  })[];
  tags: Tag[];
  reviews: Review[];
};

export const formatProductResponse = (product: ProductWithDetails): ProductResponseDTO => {
  const activeReviews = product.reviews ? product.reviews.filter((r) => !r.isHidden) : [];
  const reviewsCount = activeReviews.length;
  const ratingSum = activeReviews.reduce((sum, r) => sum + r.rating, 0);
  const rating = reviewsCount > 0 ? Number((ratingSum / reviewsCount).toFixed(1)) : 0.0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    images: product.images ? product.images.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
    })) : [],
    variants: product.variants ? product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      stock: v.stock,
      images: v.images ? v.images.map((vi) => vi.url) : [],
    })) : [],
    tags: product.tags ? product.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })) : [],
    rating,
    reviewsCount,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

