import { Product, ProductImage, Tag, Category, Review, ProductVariant, ProductVariantImage, OrderItem } from '@prisma/client';

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
  bestSellerOrder: number;
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
  specifications: any;
  salesCount: number;
  createdAt: Date;
  updatedAt: Date;
  eventPromo?: {
    eventId: string;
    eventTitle: string;
    discountPercentage: number;
    discountedPrice: number;
  } | null;
}

export type ProductWithDetails = Product & {
  category: Category;
  images: ProductImage[];
  variants: (ProductVariant & {
    images: ProductVariantImage[];
  })[];
  tags: Tag[];
  reviews: Review[];
  orderItems?: OrderItem[];
  events?: {
    id: string;
    title: string;
    discountPercentage: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }[];
};

export const formatProductResponse = (product: ProductWithDetails): ProductResponseDTO => {
  const activeReviews = product.reviews ? product.reviews.filter((r) => !r.isHidden) : [];
  const reviewsCount = activeReviews.length;
  const ratingSum = activeReviews.reduce((sum, r) => sum + r.rating, 0);
  const rating = reviewsCount > 0 ? Number((ratingSum / reviewsCount).toFixed(1)) : 0.0;

  const now = new Date();
  const activeEvent = product.events?.find(
    (e) => e.isActive && new Date(e.startDate) <= now && new Date(e.endDate) >= now && e.discountPercentage > 0
  );

  const eventPromo = activeEvent ? {
    eventId: activeEvent.id,
    eventTitle: activeEvent.title,
    discountPercentage: activeEvent.discountPercentage,
    discountedPrice: Number((product.price * (1 - activeEvent.discountPercentage / 100)).toFixed(2))
  } : null;

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
    bestSellerOrder: product.bestSellerOrder,
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
    specifications: product.specifications,
    salesCount: product.orderItems ? product.orderItems.reduce((sum, item) => sum + item.quantity, 0) : 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    eventPromo,
  };
};

