import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be greater than 0'),
    compareAtPrice: z.number().positive('Compare at price must be positive').optional(),
    stock: z.number().int().nonnegative('Stock cannot be negative').default(0),
    categoryId: z.string().min(1, 'Category is required'),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    variants: z.array(z.object({
      id: z.string().optional(),
      name: z.string().min(1, 'Variant name is required'),
      price: z.number().positive('Variant price must be positive').optional().nullable(),
      stock: z.number().int().nonnegative('Variant stock cannot be negative').default(0),
      images: z.array(z.string()).optional(),
    })).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    compareAtPrice: z.number().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
    categoryId: z.string().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    variants: z.array(z.object({
      id: z.string().optional(),
      name: z.string().min(1, 'Variant name is required'),
      price: z.number().positive('Variant price must be positive').optional().nullable(),
      stock: z.number().int().nonnegative('Variant stock cannot be negative').default(0),
      images: z.array(z.string()).optional(),
    })).optional(),
  }),
});
