export interface ProductQueryFilters {
  page?: number;
  limit?: number;
  featured?: boolean;
  category?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  q?: string;
  categoryId?: string;
  tagId?: string;
}

export interface CreateProductVariantInput {
  id?: string;
  name: string;
  price?: number | null;
  stock: number;
  images?: string[];
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  categoryId: string;
  tags?: string[]; // Tag slugs or ids
  images?: string[]; // Image URLs
  variants?: CreateProductVariantInput[];
  specifications?: Record<string, string> | null;
  bestSellerOrder?: number;
}
