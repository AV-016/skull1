import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { protect } from '../middlewares/auth.middleware';
import { restrictToAdmin } from '../middlewares/admin.middleware';

const controller = new EventController();

// 1. Public Event Routes (/api/events)
export const eventRouter = Router();
eventRouter.get('/active', controller.getActiveEvents);
eventRouter.get('/:id', controller.getEventById);

// 2. Admin Event Routes (Mounted at /api/admin/events)
export const adminEventRouter = Router();
adminEventRouter.use(protect, restrictToAdmin);
adminEventRouter.get('/', controller.getAllEvents);
adminEventRouter.get('/:id', controller.getEventById);
adminEventRouter.post('/', controller.createEvent);
adminEventRouter.patch('/:id', controller.updateEvent);
adminEventRouter.delete('/:id', controller.deleteEvent);

export default eventRouter;
