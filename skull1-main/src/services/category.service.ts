import { prisma } from '../config/database';
import { Category } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

export class CategoryService {
  async getCategories(): Promise<Category[]> {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new AppError(404, 'Category not found');
    }
    return category;
  }

  async createCategory(data: any): Promise<Category> {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new AppError(400, 'Category already exists');
    }

    return prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });
  }

  async updateCategory(id: string, data: any): Promise<Category> {
    await this.getCategoryById(id);

    let slug: string | undefined;
    if (data.name) {
      slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    return prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.getCategoryById(id);

    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new AppError(
        400,
        'Cannot delete category because it has associated products. Please delete or reassign the products first.'
      );
    }

    await prisma.category.delete({
      where: { id },
    });
  }
}

export default CategoryService;
