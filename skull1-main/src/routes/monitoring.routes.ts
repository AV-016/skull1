import { Router } from 'express';
import { MonitoringController } from '../controllers/monitoring.controller';

const router = Router();
const controller = new MonitoringController();

router.get('/stats', controller.getStats);

export default router;
