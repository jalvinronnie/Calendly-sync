import { Router } from 'express';
import { authenticationMiddleware } from '../middlewares/authentication.js';
import * as authController from '../controllers/auth-controller.js';

const router = Router();

router.get('/auth', authenticationMiddleware, authController.authorize);
// router.get('/auth/github/callback/:userId', authController.githubCallback);
router.get('/auth/monday/callback', authController.mondayCallback);
router.get('/auth/calendly', authenticationMiddleware, authController.authorizeCalendly);
router.get('/auth/calendly/callback', authController.calendlyCallback);
router.post('/logout', authenticationMiddleware, authController.logout);

export default router;
