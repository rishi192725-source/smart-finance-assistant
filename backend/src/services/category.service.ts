import { PrismaClient, CategoryType } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

export const categoryService = {
  async createCategory(userId: string, name: string, type: CategoryType) {
    return prisma.category.create({
      data: { userId, name, type },
    });
  },

  async getCategories(userId: string) {
    return prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getCategoryById(userId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    return category;
  },

  async updateCategory(userId: string, categoryId: string, data: { name?: string; type?: CategoryType }) {
    // Verify existence and ownership
    await this.getCategoryById(userId, categoryId);

    return prisma.category.update({
      where: { id: categoryId },
      data,
    });
  },

  async deleteCategory(userId: string, categoryId: string) {
    // Verify existence and ownership
    await this.getCategoryById(userId, categoryId);

    await prisma.category.delete({
      where: { id: categoryId },
    });
    return { success: true };
  },
};
