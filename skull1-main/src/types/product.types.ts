export interface ProductQueryFilters {
  page?: number;
  limit?: number;
  featured?: boolean;
  category?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'new' | 'bestsellers';
  q?: string;
  categoryId?: string;
  tagId?: string;
  showInactive?: boolean;
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
  slug?: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  categoryId: string;
  categoryName?: string;
  tags?: string[]; // Tag slugs or ids
  images?: string[]; // Image URLs
  variants?: CreateProductVariantInput[];
  specifications?: Record<string, string> | null;
  bestSellerOrder?: number;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  isActive?: boolean;
}
