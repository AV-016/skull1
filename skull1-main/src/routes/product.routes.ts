import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';

const router = Router();
const controller = new ProductController();

// 1. Public Product Routes (/api/products)
router.get('/', controller.getProducts);
router.get('/featured', controller.getFeaturedProducts);
router.get('/slug/:slug', controller.getProductBySlug);
router.get('/:id', controller.getProductById);
router.get('/category/:categoryId', controller.getProductsByCategory);
router.get('/tag/:tagId', controller.getProductsByTag);

// 2. Product Image Routes (Public/Authenticated)
router.post('/:id/images', protect, controller.addImage);
router.delete('/images/:imageId', protect, controller.deleteImage);
router.patch('/images/:imageId/primary', protect, controller.setPrimaryImage);

// 3. Admin Product Routes (Mounted at /api/admin/products)
export const adminProductRouter = Router();
adminProductRouter.use(protect, restrictToAdmin);
adminProductRouter.post('/', validate(createProductSchema), controller.createProduct);
adminProductRouter.post('/bulk', controller.bulkCreateProducts);
adminProductRouter.patch('/bulk-publish', controller.bulkPublishProducts);
adminProductRouter.patch('/:id', validate(updateProductSchema), controller.updateProduct);
adminProductRouter.delete('/:id', controller.deleteProduct);
adminProductRouter.patch('/:id/toggle-active', controller.toggleActive);
adminProductRouter.patch('/:id/toggle-featured', controller.toggleFeatured);

// 4. Tag Routes (Exposed under /api/tags and /api/admin/tags)
export const tagRouter = Router();
// GET /api/tags - Mock implementation placeholder returning tags
tagRouter.get('/', async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
});

export const adminTagRouter = Router();
adminTagRouter.use(protect, restrictToAdmin);
adminTagRouter.post('/', async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const tag = await prisma.tag.create({ data: { name: req.body.name, slug } });
    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    next(error);
  }
});
adminTagRouter.patch('/:id', async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const slug = req.body.name ? req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : undefined;
    const tag = await prisma.tag.update({
      where: { id: req.params.id },
      data: { name: req.body.name, slug },
    });
    res.status(200).json({ success: true, data: tag });
  } catch (error) {
    next(error);
  }
});
adminTagRouter.delete('/:id', async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    await prisma.tag.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
