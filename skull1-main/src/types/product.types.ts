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

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  categoryId: string;
  tags?: string[]; // Tag slugs or ids
  images?: string[]; // Image URLs
}
