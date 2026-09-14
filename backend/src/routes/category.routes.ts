import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import * as categoryController from '../controllers/category.controller';

const router = Router();

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['INCOME', 'EXPENSE']),
  }).strict(),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
  }).strict(),
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
});

router.use(protect);

router.post('/', validate(createCategorySchema), categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.patch('/:id', validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
