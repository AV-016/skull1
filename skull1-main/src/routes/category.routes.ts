import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';

const router = Router();
const controller = new CategoryController();

// Public Category Routes (/api/categories)
router.get('/', controller.getCategories);
router.get('/:id', controller.getCategoryById);

// Admin Category Routes (Mounted at /api/admin/categories)
export const adminCategoryRouter = Router();
adminCategoryRouter.use(protect, restrictToAdmin);
adminCategoryRouter.post('/', controller.createCategory);
adminCategoryRouter.patch('/:id', controller.updateCategory);
adminCategoryRouter.delete('/:id', controller.deleteCategory);

export default router;
