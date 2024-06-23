// src/routes/trigger.js
import { authenticationMiddleware } from '../middlewares/authentication.js';
import * as triggerController from '../controllers/trigger-controller.js';
import { Router } from 'express';

const router = Router();

router.post('/monday/subscribe', authenticationMiddleware, triggerController.subscribe);
router.post('/monday/unsubscribe', authenticationMiddleware, triggerController.unsubscribe);
router.post('/integration/integration-events/:subscriptionId', triggerController.triggerEventsHandler);

export default router;
